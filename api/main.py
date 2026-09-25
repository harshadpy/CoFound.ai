from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import uuid
import json
import asyncio
from agents.graph import app as graph_app
from config.config import settings

app = FastAPI(title="CoFound.ai API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for MVP (replace with DB later)
ANALYSIS_STORE = {}

class AnalysisRequest(BaseModel):
    raw_text: str
    context_tags: Dict[str, Any] = {}

class AnalysisResponse(BaseModel):
    analysis_id: str
    status: str

@app.get("/")
def read_root():
    return {"status": "ok", "service": "CoFound.ai Backend"}

async def run_analysis_background(analysis_id: str, raw_text: str, context_tags: Dict[str, Any]):
    """
    Runs the LangGraph workflow in the background and updates the store.
    """
    try:
        ANALYSIS_STORE[analysis_id]["status"] = "running"
        
        # Initial state
        initial_state = {
            "user_id": "test_user", # Placeholder
            "analysis_id": analysis_id,
            "raw_text": raw_text,
            "context_tags": context_tags
        }
        
        # Track agent execution with streaming
        accumulated_state = {}
        async for event in graph_app.astream(initial_state):
            # event is a dict like {"node_name": state_dict}
            for node_name, state_update in event.items():
                print(f"[GRAPH] Node '{node_name}' executing...")
                # Update agent status to completed
                if node_name in ANALYSIS_STORE[analysis_id]["agent_statuses"]:
                    ANALYSIS_STORE[analysis_id]["agent_statuses"][node_name] = "completed"
                # Accumulate state updates
                if isinstance(state_update, dict):
                    accumulated_state.update(state_update)
                    # Extract metrics for live display
                    if node_name == "competitor" and "competitor_results" in state_update:
                        comp_data = state_update["competitor_results"]
                        if isinstance(comp_data, dict):
                            count = len(comp_data.get("direct_competitors", []))
                            ANALYSIS_STORE[analysis_id]["agent_metrics"]["competitor"] = f"Found {count} competitors"
                    elif node_name == "trend" and "trend_results" in state_update:
                        trend_data = state_update["trend_results"]
                        if isinstance(trend_data, dict):
                            count = len(trend_data.get("macro_trends", []))
                            ANALYSIS_STORE[analysis_id]["agent_metrics"]["trend"] = f"Analyzing {count} trends"
                    elif node_name == "validation" and "validation_results" in state_update:
                        val_data = state_update["validation_results"]
                        if isinstance(val_data, dict):
                            count = len(val_data.get("validation_points", []))
                            ANALYSIS_STORE[analysis_id]["agent_metrics"]["validation"] = f"{count} user insights"
        
        # Store result
        ANALYSIS_STORE[analysis_id]["status"] = "completed"
        ANALYSIS_STORE[analysis_id]["result"] = accumulated_state
        print(f"[GRAPH] Final state keys: {list(accumulated_state.keys())}")
        
    except Exception as e:
        ANALYSIS_STORE[analysis_id]["status"] = "failed"
        ANALYSIS_STORE[analysis_id]["error"] = str(e)
        print(f"[ERROR] Analysis failed: {e}")
        import traceback
        traceback.print_exc()


@app.post("/api/analysis/start", response_model=AnalysisResponse)
async def start_analysis(request: AnalysisRequest, background_tasks: BackgroundTasks):
    analysis_id = str(uuid.uuid4())
    
    ANALYSIS_STORE[analysis_id] = {
        "id": analysis_id,
        "status": "pending",
        "created_at": "now",
        "agent_statuses": {
            "structure": "pending",
            "ideation": "pending",
            "similarity": "pending",
            "validation": "pending",
            "feasibility": "pending",
            "critic": "pending",
            "competitor": "pending",
            "trend": "pending",
            "synthesis": "pending",
            "decision": "pending",
            "report": "pending"
        },
        "agent_metrics": {}
    }
    
    background_tasks.add_task(run_analysis_background, analysis_id, request.raw_text, request.context_tags)
    
    return {"analysis_id": analysis_id, "status": "pending"}

@app.get("/api/analysis/{analysis_id}/status")
async def get_analysis_status(analysis_id: str):
    if analysis_id not in ANALYSIS_STORE:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    data = ANALYSIS_STORE[analysis_id]
    
    print(f"[API] Status check for {analysis_id}: {data['status']}")
    
    # Construct a simplified progress object
    # In a real app we'd stream events. For polling, we just return current status.
    return {
        "status": data["status"],
        "error": data.get("error"),
        "agent_statuses": data.get("agent_statuses", {}),
        "agent_metrics": data.get("agent_metrics", {}),
        "progress_percentage": calculate_progress(data.get("agent_statuses", {}))
    }

def calculate_progress(agent_statuses: dict) -> int:
    """Calculate overall progress based on agent completion"""
    total_agents = 11
    completed = sum(1 for status in agent_statuses.values() if status == "completed")
    return int((completed / total_agents) * 100)

@app.get("/api/analysis/{analysis_id}/report")
async def get_analysis_report(analysis_id: str):
    if analysis_id not in ANALYSIS_STORE:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    data = ANALYSIS_STORE[analysis_id]
    if data["status"] != "completed":
        raise HTTPException(status_code=400, detail="Analysis not completed")
        
    final_state = data["result"]
    
    print(f"[API] Returning report for {analysis_id}: {final_state.keys()}")
    
    return {
        "report_md": final_state.get("final_report_md"),
        "report_html": final_state.get("final_report_html"),
        "structured_data": final_state  # Return complete state with all agent results
    }


@app.get("/api/trends")
def get_trends():
    return [
        {"id": 1, "name": "Compound AI Systems", "growth": "+450%", "sentiment": "positive", "category": "Tech"},
        {"id": 2, "name": "Sustainable Supply Chain", "growth": "+120%", "sentiment": "positive", "category": "Logistics"},
        {"id": 3, "name": "Hyper-Personalization", "growth": "+85%", "sentiment": "neutral", "category": "Consumer"},
        {"id": 4, "name": "Remote Health Monitoring", "growth": "+200%", "sentiment": "positive", "category": "Health"},
        {"id": 5, "name": "Voice-First Interfaces", "growth": "+150%", "sentiment": "mixed", "category": "Tech"},
        {"id": 6, "name": "FinOps Tools", "growth": "+300%", "sentiment": "positive", "category": "Finance"}
    ]

@app.get("/api/competitors")
def get_competitors():
    return [
        {
            "id": 1, "name": "RecruitAI", "overlap": 85, "saturation": 90, 
            "differentiator": "Enterprise Focus", "pricing": "$50k/yr", "logo": "R"
        },
        {
            "id": 2, "name": "SourceBot", "overlap": 60, "saturation": 45, 
            "differentiator": "Chrome Extension", "pricing": "$29/mo", "logo": "S"
        },
        {
            "id": 3, "name": "TalentFlow", "overlap": 40, "saturation": 70, 
            "differentiator": "ATS Integration", "pricing": "$199/mo", "logo": "T"
        },
        {
            "id": 4, "name": "HireFast", "overlap": 25, "saturation": 30, 
            "differentiator": "Speed", "pricing": "Freemium", "logo": "H"
        },
        {
            "id": 5, "name": "AutoHunter", "overlap": 75, "saturation": 65, 
            "differentiator": "Email Automation", "pricing": "$499/mo", "logo": "A"
        }
    ]

@app.get("/api/market-gaps")
def get_market_gaps():
    return {
        "heatmap": [
            { "painPoint": "Manual Data Entry", "segments": [{"val": 90, "label": "High"}, {"val": 40, "label": "Low"}, {"val": 65, "label": "Med"}] },
            { "painPoint": "Compliance Risk", "segments": [{"val": 20, "label": "Low"}, {"val": 85, "label": "High"}, {"val": 50, "label": "Med"}] },
            { "painPoint": "Integration Friction", "segments": [{"val": 75, "label": "High"}, {"val": 30, "label": "Low"}, {"val": 60, "label": "Med"}] },
            { "painPoint": "Cost Sensitivity", "segments": [{"val": 95, "label": "High"}, {"val": 10, "label": "Low"}, {"val": 55, "label": "Med"}] },
        ],
        "segments": ["SMBs / Founders", "Enterprise", "Mid-Market Agencies"],
        "gap_chart": [
            { "name": 'Auto-Sourcing', "gap": 85, "current": 30 },
            { "name": 'Pricing Transparency', "gap": 70, "current": 40 },
            { "name": 'MobileFirst UX', "gap": 60, "current": 20 },
            { "name": 'Open API', "gap": 50, "current": 80 },
        ]
    }


# ─────────────────────────────────────────────────────
# Sidebar Tool Endpoints — real AI-powered (use agents)
# ─────────────────────────────────────────────────────

class ToolRequest(BaseModel):
    query: str
    sector: str = ""
    segment: str = ""
    problem: str = ""
    audience: str = ""

def _build_state(req: ToolRequest) -> dict:
    """Build a minimal AgentState-compatible dict from a tool request."""
    return {
        "structured_thought": {
            "core_idea": req.query,
            "primary_sector": req.sector or req.query,
            "problem_statement": req.problem or req.query,
            "target_audience": req.audience or req.segment or "general market",
        }
    }

@app.post("/api/tools/trends")
async def tool_trends(req: ToolRequest):
    """Run the Trend Intelligence Agent on demand for the Trend Explorer page."""
    from agents.trend_intelligence.agent import trend_node
    try:
        state = _build_state(req)
        result = await asyncio.get_event_loop().run_in_executor(None, trend_node, state)
        return result.get("trend_results", result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tools/competitors")
async def tool_competitors(req: ToolRequest):
    """Run the Competitor Analysis Agent on demand for the Competitor Research page."""
    from agents.competitor_analysis.agent import competitor_node
    try:
        state = _build_state(req)
        result = await asyncio.get_event_loop().run_in_executor(None, competitor_node, state)
        return result.get("competitor_results", result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tools/market-gaps")
async def tool_market_gaps(req: ToolRequest):
    """Run the Market Validation Agent on demand for the Market Gaps page."""
    from agents.market_validation.agent import validation_node
    try:
        state = _build_state(req)
        result = await asyncio.get_event_loop().run_in_executor(None, validation_node, state)
        return result.get("validation_results", result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tools/brainstorm")
async def tool_brainstorm(req: ToolRequest):
    """Run the Ideation Agent on demand for the Idea Brainstorming page."""
    from agents.ideation.agent import ideation_node
    try:
        state = _build_state(req)
        result = await asyncio.get_event_loop().run_in_executor(None, ideation_node, state)
        return result.get("ideation_results", result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ideation")
def get_ideation():
    return [
        {
            "id": 1,
            "title": "AI-Powered Technical Co-Founder",
            "description": "An autonomous AI agent that handles boilerplate code, project scaffolding, and initial architecture design for non-technical founders.",
            "targetAudience": "Non-technical founders, early-stage startups",
            "revenueModel": "SaaS Subscription ($49-$199/mo)",
            "feasibility": 85,
            "innovation": 90,
            "impact": 80,
            "status": "High Potential"
        },
        {
            "id": 2,
            "title": "Automated Competitor Tracking API",
            "description": "A developer-first API that actively scrapes and summarizes competitor pricing changes, feature releases, and market positioning.",
            "targetAudience": "Product managers, growth teams, VC analysts",
            "revenueModel": "API Usage Based ($0.05/request)",
            "feasibility": 90,
            "innovation": 75,
            "impact": 85,
            "status": "Quick Win"
        },
        {
            "id": 3,
            "title": "Micro-SaaS Valuation Platform",
            "description": "A marketplace and valuation engine specifically for micro-SaaS businesses doing $1k-$10k MRR, automating due diligence.",
            "targetAudience": "Indie hackers, micro private equity",
            "revenueModel": "Transaction Fee (5%)",
            "feasibility": 70,
            "innovation": 85,
            "impact": 75,
            "status": "Explore"
        },
        {
            "id": 4,
            "title": "B2B Intent Data Synthesizer",
            "description": "Aggregates social signals, job postings, and domain registrations to predict when a B2B company is about to purchase specific software.",
            "targetAudience": "B2B Sales Teams, SDRs",
            "revenueModel": "Enterprise Tier ($1k+/mo)",
            "feasibility": 65,
            "innovation": 80,
            "impact": 95,
            "status": "High Risk / High Reward"
        }
    ]
