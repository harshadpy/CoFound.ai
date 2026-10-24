import json
import structlog
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from config.config import settings
from data.supabase_client import get_user_profile, get_analysis_from_supabase
import data.database as local_db

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/copilot", tags=["AI Strategic Copilot"])

class ChatMessage(BaseModel):
    role: str # "user" or "assistant"
    content: str

class CopilotChatRequest(BaseModel):
    message: str
    analysis_id: Optional[str] = None
    conversation_history: Optional[List[ChatMessage]] = Field(default_factory=list)
    user_id: str = "default_user"

@router.post("/chat")
def copilot_chat(req: CopilotChatRequest):
    """
    AI Strategic Advisor Copilot grounded on active analysis dossiers and market research.
    """
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # Determine OpenAI API Key (check BYOK first, fallback to system)
    user_profile = get_user_profile(req.user_id)
    custom_keys = (user_profile or {}).get("custom_api_keys") or {}
    api_key = custom_keys.get("openai") or settings.openai_api_key

    # Fetch dossier context if analysis_id provided
    context_text = ""
    context_title = None
    if req.analysis_id:
        analysis = get_analysis_from_supabase(req.analysis_id) or local_db.get_analysis(req.analysis_id)
        if analysis:
            result = analysis.get("result") or {}
            raw_text = analysis.get("raw_text", "")
            context_title = result.get("title") or raw_text[:50]
            
            # Extract key findings from modern swarm results or legacy schema
            synthesis = result.get("synthesis_results") or {}
            decision = result.get("decision_results") or result.get("decision") or {}
            critic = result.get("critic_results") or result.get("critic") or {}
            competitor_data = result.get("competitor_results") or {}
            
            summary = (
                synthesis.get("executive_summary") or
                result.get("executive_summary") or
                result.get("summary") or
                ""
            )
            verdict = decision.get("decision") or decision.get("verdict", "N/A")
            confidence = decision.get("confidence_score", "N/A")
            survival = critic.get("survival_probability", "N/A")
            fatal_flaws = critic.get("fatal_flaws") or []
            
            raw_comps = (
                competitor_data.get("direct_competitors") or
                result.get("competitors") or
                []
            )
            comp_names = [c.get("name") if isinstance(c, dict) else str(c) for c in raw_comps[:5]]
            
            context_text = f"""
CURRENT STARTUP REPORT DOSSIER:
- Title / Concept: {context_title}
- Executive Summary: {summary}
- Recommendation: {verdict} (Confidence: {confidence}%)
- 2-Year Survival Probability: {survival}%
- Fatal Flaws identified: {json.dumps(fatal_flaws)}
- Key Competitors: {json.dumps(comp_names)}
"""

    system_prompt = f"""You are the CoFound.ai Executive Strategic Copilot — a seasoned Y-Combinator partner and veteran venture capitalist.
Your role is to advise founders directly on strategy, unit economics, go-to-market execution, defensive moats, and investor pitching.

{context_text}

Rules:
1. Be direct, quantitative, and action-oriented. Avoid generic fluff or platitudes.
2. If citing the dossier, refer specifically to the market gaps, competitors, or survival probability.
3. Recommend specific 30-day tactical experiments or validation gates.
4. Conclude with 2 actionable follow-up questions for the founder.
"""

    messages = [SystemMessage(content=system_prompt)]

    # Add conversation history
    for msg in (req.conversation_history or [])[-6:]: # Keep last 6 turns
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        else:
            messages.append(AIMessage(content=msg.content))

    messages.append(HumanMessage(content=req.message))

    try:
        model = ChatOpenAI(model=settings.model_fast, api_key=api_key, temperature=0.3)
        response = model.invoke(messages)
        content = response.content

        # Generate 2-3 quick follow-up prompt pills
        suggested = [
            "How can we build a defensive moat against incumbents?",
            "What is the leanest MVP to test customer willingness to pay?",
            "How should we pitch our pricing model to early adopters?"
        ]

        return {
            "reply": content,
            "context_title": context_title,
            "suggested_followups": suggested
        }
    except Exception as e:
        logger.error("Copilot chat invocation failed", error=str(e))
        # Provide helpful fallback reply
        return {
            "reply": f"**Strategic Advisor Note**: I encountered an issue communicating with the reasoning model ({str(e)}). However, based on your dossier '{context_title or 'Current Concept'}', our primary recommendation is to run a low-cost concierge MVP to validate buyer willingness before scaling development.",
            "context_title": context_title,
            "suggested_followups": [
                "How to design a no-code concierge MVP?",
                "What customer interview questions should I ask?"
            ]
        }
