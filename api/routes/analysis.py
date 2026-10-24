import asyncio
import json
import uuid
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from config.config import settings

from agents.graph import app as graph_app, app_hitl, checkpointer
from observability.tracing import get_langsmith_config
from utils.logger import logger
from utils.model_router import estimate_cost_usd
from guardrails.hallucination_checks import verify_competitor_grounding
import data.database as db
from data.supabase_client import (
    sync_analysis_to_supabase,
    create_notification_in_supabase
)

router = APIRouter(tags=["Analysis"])

# Active live stream subscribers for SSE
STREAM_SUBSCRIBERS: Dict[str, List[asyncio.Queue]] = {}

async def broadcast_stream_event(analysis_id: str, event_data: dict):
    """Broadcasts a live telemetry event to all connected SSE clients for this analysis."""
    if analysis_id in STREAM_SUBSCRIBERS:
        for q in list(STREAM_SUBSCRIBERS[analysis_id]):
            try:
                await q.put(event_data)
            except Exception:
                pass

class AnalysisRequest(BaseModel):
    raw_text: str
    context_tags: Dict[str, Any] = {}
    user_id: Optional[str] = "default_user"
    hitl_enabled: Optional[bool] = False  # Human-In-The-Loop toggle

class ResumeAnalysisRequest(BaseModel):
    additional_competitors: Optional[List[str]] = []
    founder_notes: Optional[str] = None
    revised_direction: Optional[str] = None

class AnalysisResponse(BaseModel):
    analysis_id: str
    status: str
    hitl_enabled: bool = False

async def _process_stream_events(analysis_id: str, stream_iterable, accumulated_state: dict):
    """Helper to process LangGraph node completion events and stream telemetry."""
    async for event in stream_iterable:
        for node_name, state_update in event.items():
            if node_name == "__interrupt__":
                continue
            print(f"[GRAPH] Node '{node_name}' completed.")
            metric_label = None

            if isinstance(state_update, dict):
                accumulated_state.update(state_update)

                # Extract node-specific metrics for live telemetry
                if node_name == "competitor" and "competitor_results" in state_update:
                    comp_data = state_update["competitor_results"]
                    if isinstance(comp_data, dict):
                        count = len(comp_data.get("direct_competitors", []))
                        sat = comp_data.get("saturation_score", "N/A")
                        metric_label = f"{count} rivals | Saturation {sat}/10"

                elif node_name == "trend" and "trend_results" in state_update:
                    trend_data = state_update["trend_results"]
                    if isinstance(trend_data, dict):
                        cagr = trend_data.get("market_growth_cagr", "")
                        size = trend_data.get("market_size_estimate", "")
                        metric_label = f"CAGR {cagr} | {size}".strip(" |")

                elif node_name == "validation" and "validation_results" in state_update:
                    val_data = state_update["validation_results"]
                    if isinstance(val_data, dict):
                        verdict = val_data.get("overall_verdict", "")
                        points = len(val_data.get("validation_points", []))
                        metric_label = f"{verdict} ({points} signals)"

                elif node_name == "feasibility" and "feasibility_results" in state_update:
                    feas_data = state_update["feasibility_results"]
                    if isinstance(feas_data, dict):
                        score = feas_data.get("complexity_score", "")
                        metric_label = f"Complexity {score}/10"

                elif node_name == "synthesis" and "synthesis_results" in state_update:
                    metric_label = "Opportunity & Strategy Consolidated"

                elif node_name == "critic" and "critic_results" in state_update:
                    critic_data = state_update["critic_results"]
                    if isinstance(critic_data, dict):
                        penalty = critic_data.get("confidence_penalty", 0)
                        flaws = len(critic_data.get("fatal_flaws", []))
                        metric_label = f"-{penalty} pts | {flaws} flaws"

                elif node_name == "decision" and ("decision_verdict" in state_update or "decision_results" in state_update):
                    dec_data = state_update.get("decision_verdict") or state_update.get("decision_results")
                    if isinstance(dec_data, dict):
                        verdict = dec_data.get("verdict") or dec_data.get("decision", "")
                        conf = dec_data.get("confidence_score", "")
                        metric_label = f"Verdict: {verdict} ({conf}%)"

                elif node_name == "report":
                    metric_label = "Institutional VC Dossier Compiled"

            # Persist step progress to SQLite
            record = db.update_agent_progress(
                analysis_id=analysis_id,
                agent_name=node_name,
                status="completed",
                metric=metric_label
            )

            # Broadcast live agent update to connected SSE clients
            await broadcast_stream_event(analysis_id, {
                "type": "agent_progress",
                "agent": node_name,
                "agent_status": "completed",
                "status": "running",
                "metric": metric_label,
                "progress_percentage": record.get("progress_percentage", 50) if record else 50,
                "agent_statuses": record.get("agent_statuses", {}) if record else {}
            })

            # Proactively activate the next downstream agent as 'running' so user sees continuous progress
            next_node = None
            next_metric = None
            if node_name == "structure":
                # Parallel research nodes start running
                for r_node in ["ideation", "similarity", "validation", "trend", "competitor", "feasibility"]:
                    db.update_agent_progress(analysis_id=analysis_id, agent_name=r_node, status="running", metric="Analyzing sector signals...")
            elif node_name == "synthesis":
                next_node = "critic"
                next_metric = "Adversarial stress-testing underway..."
            elif node_name == "critic":
                next_node = "decision"
                next_metric = "Formulating institutional verdict & confidence score..."
            elif node_name == "decision":
                next_node = "report"
                next_metric = "Compiling research dossier..."

            if next_node:
                db.update_agent_progress(
                    analysis_id=analysis_id,
                    agent_name=next_node,
                    status="running",
                    metric=next_metric
                )
                rec = db.get_analysis(analysis_id)
                await broadcast_stream_event(analysis_id, {
                    "type": "agent_progress",
                    "agent": next_node,
                    "agent_status": "running",
                    "status": "running",
                    "metric": next_metric,
                    "progress_percentage": rec.get("progress_percentage", 65) if rec else 65,
                    "agent_statuses": rec.get("agent_statuses", {}) if rec else {}
                })

async def _finalize_analysis(analysis_id: str, user_id: str, accumulated_state: dict):
    """Finalizes an analysis run, performs anti-hallucination verification, persists data, and emits notification."""
    # Guardrail: Cross-reference competitor results against raw search context
    if "competitor_results" in accumulated_state and isinstance(accumulated_state["competitor_results"], dict):
        raw_search = accumulated_state["competitor_results"].get("raw_search_context", "")
        accumulated_state["competitor_results"] = verify_competitor_grounding(
            accumulated_state["competitor_results"],
            raw_search
        )

    # Attach token & economics metadata (estimated benchmark)
    estimated_tokens = 24_500
    accumulated_state["token_metrics"] = {
        "estimated_total_tokens": estimated_tokens,
        "estimated_cost_usd": estimate_cost_usd("gpt-4o", 18_000, 6_500),
        "checkpointer": "sqlite-durable",
        "checkpoint_thread_id": analysis_id
    }

    # Save final state result to SQLite
    db.save_analysis_result(analysis_id, accumulated_state)
    
    # Dual-layer sync: Sync to Supabase PostgreSQL
    completed_record = db.get_analysis(analysis_id)
    if completed_record:
        sync_analysis_to_supabase(completed_record)
        
        decision = accumulated_state.get("decision_results") or accumulated_state.get("decision_verdict", {})
        verdict = decision.get("decision") or decision.get("verdict", "COMPLETED")
        conf = decision.get("confidence_score", "N/A")
        raw_title = (accumulated_state.get("structured_thought") or {}).get("core_idea") or completed_record.get("raw_text", "Startup Idea")
        display_title = (raw_title[:45] + "...") if len(raw_title) > 45 else raw_title
        
        create_notification_in_supabase({
            "user_id": user_id,
            "title": f"Swarm Analysis Complete: {display_title}",
            "message": f"Verdict: {verdict} ({conf}% confidence). Institutional VC audit ready for review.",
            "type": "analysis_complete",
            "link": f"/report?id={analysis_id}",
            "metadata": {
                "analysis_id": analysis_id,
                "verdict": verdict,
                "confidence_score": conf
            },
            "is_read": False
        })
    
    # Broadcast completion event to SSE clients
    await broadcast_stream_event(analysis_id, {
        "type": "completed",
        "status": "completed",
        "progress_percentage": 100,
        "result_summary": {
            "decision": accumulated_state.get("decision_results") or accumulated_state.get("decision_verdict", {}),
            "critic": accumulated_state.get("critic_results", {})
        }
    })
    print(f"[GRAPH] Analysis {analysis_id} finished successfully, persisted to SQLite & Supabase.")

async def run_analysis_background(
    analysis_id: str,
    raw_text: str,
    context_tags: Dict[str, Any],
    user_id: str = "default_user",
    hitl_enabled: bool = False
):
    """
    Runs the 11-agent LangGraph workflow in the background with durable SQLite checkpointing.
    If hitl_enabled=True, pauses before 'synthesis' for human review.
    """
    try:
        db.update_analysis_status(analysis_id, "running")
        await broadcast_stream_event(analysis_id, {
            "type": "status_change",
            "status": "running",
            "progress_percentage": 5
        })
        
        initial_state = {
            "user_id": user_id,
            "analysis_id": analysis_id,
            "raw_text": raw_text,
            "context_tags": context_tags,
            "hitl_enabled": hitl_enabled
        }
        
        # Configure LangSmith run telemetry and checkpoint thread_id
        run_config = get_langsmith_config(
            analysis_id=analysis_id,
            user_id=user_id,
            tags=["graph-pipeline", "market-intelligence", f"hitl-{hitl_enabled}"],
            metadata={
                "raw_text": raw_text[:200],
                "context_tags": context_tags,
                "hitl_enabled": hitl_enabled
            }
        )
        run_config["configurable"] = {"thread_id": analysis_id}

        workflow_engine = app_hitl if hitl_enabled else graph_app
        accumulated_state = {}

        await _process_stream_events(analysis_id, workflow_engine.astream(initial_state, config=run_config), accumulated_state)

        # Check if the graph paused on a human-in-the-loop interrupt
        state_snapshot = workflow_engine.get_state(run_config)
        if state_snapshot.next and "synthesis" in state_snapshot.next:
            # We reached the HITL pause point!
            db.update_analysis_status(analysis_id, "awaiting_review", progress_percentage=60)
            
            review_payload = {
                "type": "hitl_interrupt",
                "status": "awaiting_review",
                "stage": "synthesis",
                "message": "Market discovery complete. Awaiting founder steering before Synthesis and VC Critic challenge.",
                "review_data": {
                    "structured_thought": accumulated_state.get("structured_thought"),
                    "competitors": (accumulated_state.get("competitor_results") or {}).get("direct_competitors", []),
                    "validation_verdict": (accumulated_state.get("validation_results") or {}).get("overall_verdict"),
                    "market_growth_cagr": (accumulated_state.get("trend_results") or {}).get("market_growth_cagr"),
                    "complexity_score": (accumulated_state.get("feasibility_results") or {}).get("complexity_score"),
                }
            }
            await broadcast_stream_event(analysis_id, review_payload)
            print(f"[GRAPH] Analysis {analysis_id} paused at HITL interrupt before synthesis.")
            return

        # Fully completed
        await _finalize_analysis(analysis_id, user_id, accumulated_state)

    except Exception as e:
        logger.error("analysis_background_error", analysis_id=analysis_id, error=str(e))
        db.update_analysis_status(analysis_id, "failed", error=str(e))
        failed_record = db.get_analysis(analysis_id)
        if failed_record:
            sync_analysis_to_supabase(failed_record)
            
        create_notification_in_supabase({
            "user_id": user_id,
            "title": "Analysis Run Failed",
            "message": f"Agent swarm halted: {str(e)[:90]}",
            "type": "warning",
            "link": f"/",
            "metadata": {"analysis_id": analysis_id, "error": str(e)},
            "is_read": False
        })

        await broadcast_stream_event(analysis_id, {
            "type": "failed",
            "status": "failed",
            "error": str(e)
        })

async def resume_analysis_background(
    analysis_id: str,
    feedback: Dict[str, Any],
    user_id: str = "default_user"
):
    """
    Resumes a paused LangGraph workflow from its persistent SQLite checkpoint.
    """
    try:
        db.update_analysis_status(analysis_id, "running", progress_percentage=65)
        # Immediately activate synthesis in DB & telemetry so UI is responsive
        rec = db.update_agent_progress(
            analysis_id=analysis_id,
            agent_name="synthesis",
            status="running",
            metric="Synthesizing research & founder steering..."
        )
        await broadcast_stream_event(analysis_id, {
            "type": "status_change",
            "status": "running",
            "progress_percentage": 65,
            "message": "Founder steering incorporated. Resuming Synthesis, Critic, and Decision authority..."
        })
        await broadcast_stream_event(analysis_id, {
            "type": "agent_progress",
            "agent": "synthesis",
            "agent_status": "running",
            "status": "running",
            "metric": "Synthesizing research & founder steering...",
            "progress_percentage": 65,
            "agent_statuses": rec.get("agent_statuses", {}) if rec else {}
        })

        run_config = {"configurable": {"thread_id": analysis_id}}
        
        # Update graph state with human feedback across candidate predecessors
        feedback_updated = False
        for node_cand in ["competitor", "feasibility", "trend", "validation", "ideation", "similarity"]:
            try:
                app_hitl.update_state(run_config, {"hitl_feedback": feedback}, as_node=node_cand)
                feedback_updated = True
                break
            except Exception:
                continue

        if not feedback_updated:
            try:
                app_hitl.update_state(run_config, {"hitl_feedback": feedback})
            except Exception as update_err:
                logger.warning("hitl_state_update_fallback", error=str(update_err))
        
        # Retrieve accumulated state up to this point
        current_state = app_hitl.get_state(run_config).values or {}
        accumulated_state = dict(current_state)
        # Ensure feedback is directly injected into state dictionary as fallback
        if "hitl_feedback" not in accumulated_state or not accumulated_state["hitl_feedback"]:
            accumulated_state["hitl_feedback"] = feedback

        # Stream remaining nodes: synthesis -> critic -> decision -> report
        await _process_stream_events(analysis_id, app_hitl.astream(None, config=run_config), accumulated_state)

        # Finalize
        await _finalize_analysis(analysis_id, user_id, accumulated_state)

    except Exception as e:
        logger.error("resume_analysis_background_error", analysis_id=analysis_id, error=str(e))
        db.update_analysis_status(analysis_id, "failed", error=str(e))
        await broadcast_stream_event(analysis_id, {
            "type": "failed",
            "status": "failed",
            "error": str(e)
        })

# ─── API Endpoints ──────────────────────────────────────────────────────────

@router.post("/api/analysis", response_model=AnalysisResponse)
@router.post("/api/analysis/start", response_model=AnalysisResponse)
async def start_analysis(request: AnalysisRequest, background_tasks: BackgroundTasks):
    """
    Starts an autonomous market intelligence analysis across 11 AI agents.
    Persists checkpoints to SQLite and optionally supports Human-In-The-Loop review.
    """
    analysis_id = str(uuid.uuid4())
    effective_user_id = request.user_id or "default_user"
    
    # Enforce safe AI analysis quotas for guests & registered founders
    used_count = db.count_user_analyses(effective_user_id)
    if effective_user_id.startswith("guest_"):
        if used_count >= settings.guest_analysis_limit:
            raise HTTPException(
                status_code=403,
                detail=f"Guest limit of {settings.guest_analysis_limit} analyses reached. Please create a free account to continue."
            )
    elif effective_user_id != "default_user" and settings.billing_enabled:
        if used_count >= settings.user_analysis_limit:
            raise HTTPException(
                status_code=403,
                detail=f"Usage quota of {settings.user_analysis_limit} analyses reached."
            )

    # Create persistent record in SQLite
    db.create_analysis(
        analysis_id=analysis_id,
        user_id=effective_user_id,
        raw_text=request.raw_text,
        context_tags=request.context_tags
    )
    
    # Spawn background worker
    background_tasks.add_task(
        run_analysis_background,
        analysis_id,
        request.raw_text,
        request.context_tags,
        effective_user_id,
        request.hitl_enabled or False
    )
    
    return AnalysisResponse(
        analysis_id=analysis_id,
        status="pending",
        hitl_enabled=request.hitl_enabled or False
    )

@router.post("/api/analysis/{analysis_id}/resume")
async def resume_analysis(
    analysis_id: str,
    feedback: ResumeAnalysisRequest,
    background_tasks: BackgroundTasks
):
    """
    Resumes a paused analysis from its durable SQLite checkpoint after the founder
    submits steering feedback or competitor adjustments.
    """
    record = db.get_analysis(analysis_id)
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    if record["status"] != "awaiting_review":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot resume analysis with status '{record['status']}'. Expected 'awaiting_review'."
        )

    feedback_payload = {
        "additional_competitors": feedback.additional_competitors or [],
        "founder_notes": feedback.founder_notes,
        "revised_direction": feedback.revised_direction
    }

    background_tasks.add_task(
        resume_analysis_background,
        analysis_id,
        feedback_payload,
        record.get("user_id", "default_user")
    )

    return {"status": "resumed", "analysis_id": analysis_id}

@router.get("/api/analysis/{analysis_id}/checkpoint")
async def get_analysis_checkpoint(analysis_id: str):
    """
    Inspects the durable SQLite checkpoint state for an active or completed analysis.
    Essential for distributed systems debugging and fault tolerance audits.
    """
    run_config = {"configurable": {"thread_id": analysis_id}}
    try:
        snapshot = app_hitl.get_state(run_config)
        if not snapshot or not snapshot.values:
            snapshot = graph_app.get_state(run_config)

        if not snapshot or not snapshot.values:
            return {"thread_id": analysis_id, "checkpoint_exists": False}

        return {
            "thread_id": analysis_id,
            "checkpoint_exists": True,
            "next_pending_nodes": list(snapshot.next),
            "step_count": len(snapshot.values),
            "available_keys": list(snapshot.values.keys())
        }
    except Exception as e:
        return {"thread_id": analysis_id, "checkpoint_exists": False, "error": str(e)}

@router.get("/api/analysis/{analysis_id}/status")
async def get_analysis_status(analysis_id: str):
    record = db.get_analysis(analysis_id)
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return {
        "status": record["status"],
        "error": record.get("error"),
        "agent_statuses": record.get("agent_statuses", {}),
        "agent_metrics": record.get("agent_metrics", {}),
        "progress_percentage": record.get("progress_percentage", 0)
    }

@router.get("/api/analysis/{analysis_id}/stream")
async def stream_analysis(analysis_id: str):
    """
    Server-Sent Events (SSE) endpoint providing real-time live telemetry
    as each agent in the graph executes.
    """
    record = db.get_analysis(analysis_id)
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found")

    async def event_generator():
        # Initial catch-up payload
        initial_payload = {
            "type": "init",
            "status": record["status"],
            "progress_percentage": record["progress_percentage"],
            "agent_statuses": record["agent_statuses"],
            "agent_metrics": record["agent_metrics"]
        }
        yield f"data: {json.dumps(initial_payload)}\n\n"

        if record["status"] in ("completed", "failed"):
            yield f"data: {json.dumps({'type': record['status'], 'status': record['status']})}\n\n"
            return

        queue = asyncio.Queue()
        if analysis_id not in STREAM_SUBSCRIBERS:
            STREAM_SUBSCRIBERS[analysis_id] = []
        STREAM_SUBSCRIBERS[analysis_id].append(queue)

        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"data: {json.dumps(event)}\n\n"
                    if event.get("type") in ("completed", "failed"):
                        break
                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"
        finally:
            if analysis_id in STREAM_SUBSCRIBERS and queue in STREAM_SUBSCRIBERS[analysis_id]:
                STREAM_SUBSCRIBERS[analysis_id].remove(queue)
                if not STREAM_SUBSCRIBERS[analysis_id]:
                    del STREAM_SUBSCRIBERS[analysis_id]

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/api/analysis/{analysis_id}/report")
async def get_analysis_report(analysis_id: str):
    record = db.get_analysis(analysis_id)
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    if record["status"] != "completed":
        raise HTTPException(status_code=400, detail="Analysis not completed")
        
    final_state = record.get("result") or {}
    
    return {
        "report_md": final_state.get("final_report_md"),
        "report_html": final_state.get("final_report_html"),
        "structured_data": final_state
    }

@router.get("/api/analyses")
def list_past_analyses(limit: int = 50, user_id: Optional[str] = Query(None)):
    """Returns past market analyses stored in SQLite, optionally filtered by user_id."""
    return db.list_analyses(limit=limit, user_id=user_id)

@router.delete("/api/analyses/{analysis_id}")
def delete_past_analysis(analysis_id: str, user_id: Optional[str] = Query(None)):
    """Deletes an analysis record from SQLite with ownership verification."""
    success = db.delete_analysis(analysis_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Analysis not found or permission denied.")
    return {"status": "deleted", "analysis_id": analysis_id}
