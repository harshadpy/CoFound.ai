import asyncio
import json
import uuid
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agents.graph import app as graph_app
from observability.tracing import get_langsmith_config
from utils.logger import logger
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

class AnalysisResponse(BaseModel):
    analysis_id: str
    status: str

async def run_analysis_background(analysis_id: str, raw_text: str, context_tags: Dict[str, Any]):
    """
    Runs the 11-agent LangGraph workflow in the background.
    Persists progress to SQLite and broadcasts live telemetry via SSE.
    """
    try:
        db.update_analysis_status(analysis_id, "running")
        await broadcast_stream_event(analysis_id, {
            "type": "status_change",
            "status": "running",
            "progress_percentage": 5
        })
        
        initial_state = {
            "user_id": "default_user",
            "analysis_id": analysis_id,
            "raw_text": raw_text,
            "context_tags": context_tags
        }
        
        # Configure LangSmith run telemetry
        run_config = get_langsmith_config(
            analysis_id=analysis_id,
            user_id="default_user",
            tags=["graph-pipeline", "market-intelligence"],
            metadata={
                "raw_text": raw_text[:200],
                "context_tags": context_tags
            }
        )
        
        accumulated_state = {}
        async for event in graph_app.astream(initial_state, config=run_config):
            for node_name, state_update in event.items():
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

                    elif node_name == "critic" and "critic_results" in state_update:
                        critic_data = state_update["critic_results"]
                        if isinstance(critic_data, dict):
                            penalty = critic_data.get("confidence_penalty", 0)
                            flaws = len(critic_data.get("fatal_flaws", []))
                            metric_label = f"-{penalty} pts | {flaws} flaws"

                    elif node_name == "decision" and "decision_verdict" in state_update:
                        dec_data = state_update["decision_verdict"]
                        if isinstance(dec_data, dict):
                            verdict = dec_data.get("verdict", "")
                            conf = dec_data.get("confidence_score", "")
                            metric_label = f"Verdict: {verdict} ({conf}%)"

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
                    "status": "completed",
                    "metric": metric_label,
                    "progress_percentage": record.get("progress_percentage", 50) if record else 50,
                    "agent_statuses": record.get("agent_statuses", {}) if record else {}
                })

        # Save final state result to SQLite
        db.save_analysis_result(analysis_id, accumulated_state)
        
        # Dual-layer sync: Sync to Supabase PostgreSQL
        completed_record = db.get_analysis(analysis_id)
        if completed_record:
            sync_analysis_to_supabase(completed_record)
            
            # Post real-time notification to founder via Supabase
            decision = accumulated_state.get("decision_verdict", {})
            verdict = decision.get("verdict", "COMPLETED")
            conf = decision.get("confidence_score", "N/A")
            raw_title = (accumulated_state.get("structured_thought") or {}).get("core_idea") or completed_record.get("raw_text", "Startup Idea")
            display_title = (raw_title[:45] + "...") if len(raw_title) > 45 else raw_title
            
            create_notification_in_supabase({
                "user_id": "default_user",
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
                "decision": accumulated_state.get("decision_verdict", {}),
                "critic": accumulated_state.get("critic_results", {})
            }
        })
        print(f"[GRAPH] Analysis {analysis_id} finished successfully, persisted to SQLite & Supabase.")

    except Exception as e:
        logger.error("analysis_background_error", analysis_id=analysis_id, error=str(e))
        db.update_analysis_status(analysis_id, "failed", error=str(e))
        failed_record = db.get_analysis(analysis_id)
        if failed_record:
            sync_analysis_to_supabase(failed_record)
            
        create_notification_in_supabase({
            "user_id": "default_user",
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

@router.post("/api/analysis", response_model=AnalysisResponse)
async def start_analysis(request: AnalysisRequest, background_tasks: BackgroundTasks):
    """
    Starts an autonomous market intelligence analysis across 11 AI agents.
    Creates an analysis record in SQLite and spawns the LangGraph execution.
    """
    analysis_id = str(uuid.uuid4())
    
    # Create persistent record in SQLite
    db.create_analysis(
        analysis_id=analysis_id,
        user_id="default_user",
        raw_text=request.raw_text,
        context_tags=request.context_tags
    )
    
    # Spawn background worker
    background_tasks.add_task(
        run_analysis_background,
        analysis_id,
        request.raw_text,
        request.context_tags
    )
    
    return AnalysisResponse(analysis_id=analysis_id, status="pending")

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
def list_past_analyses(limit: int = 50):
    """Returns past market analyses stored in SQLite."""
    return db.list_analyses(limit=limit)

@router.delete("/api/analyses/{analysis_id}")
def delete_past_analysis(analysis_id: str):
    """Deletes an analysis record from SQLite."""
    success = db.delete_analysis(analysis_id)
    if not success:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {"status": "deleted", "analysis_id": analysis_id}
