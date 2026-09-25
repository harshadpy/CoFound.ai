import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/tools", tags=["Research Tools"])

class ToolRequest(BaseModel):
    query: str
    sector: str = ""
    segment: str = ""
    problem: str = ""
    audience: str = ""

def _build_state(req: ToolRequest) -> dict:
    return {
        "structured_thought": {
            "core_idea": req.query,
            "primary_sector": req.sector or req.query,
            "problem_statement": req.problem or req.query,
            "target_audience": req.audience or req.segment or "general market",
        }
    }

@router.post("/trends")
async def tool_trends(req: ToolRequest):
    from agents.trend_intelligence.agent import trend_node
    try:
        state = _build_state(req)
        result = await asyncio.get_event_loop().run_in_executor(None, trend_node, state)
        return result.get("trend_results", result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/competitors")
async def tool_competitors(req: ToolRequest):
    from agents.competitor_analysis.agent import competitor_node
    try:
        state = _build_state(req)
        result = await asyncio.get_event_loop().run_in_executor(None, competitor_node, state)
        return result.get("competitor_results", result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/market-gaps")
async def tool_market_gaps(req: ToolRequest):
    from agents.market_validation.agent import validation_node
    try:
        state = _build_state(req)
        result = await asyncio.get_event_loop().run_in_executor(None, validation_node, state)
        return result.get("validation_results", result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/brainstorm")
async def tool_brainstorm(req: ToolRequest):
    from agents.ideation.agent import ideation_node
    try:
        state = _build_state(req)
        result = await asyncio.get_event_loop().run_in_executor(None, ideation_node, state)
        return result.get("ideation_results", result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
