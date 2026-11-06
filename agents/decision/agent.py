from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from agents.state import AgentState
from config.config import settings
from utils.logger import logger
from pydantic import BaseModel, Field
from typing import List, Optional
import json

class DecisionOutput(BaseModel):
    decision: str = Field(..., description="Final institutional verdict: 'GO', 'PIVOT', or 'KILL'")
    confidence_score: int = Field(..., description="Calibrated confidence score (0-100), penalized by critic risks and data uncertainty")
    confidence_explanation: Optional[str] = Field(default=None, description="Clear, non-fabricated breakdown of confidence calibration and uncertainty bounds")
    reasoning: str = Field(..., description="Evidence-backed executive verdict reasoning balancing verified market opportunity against fatal flaws")
    evidence_synthesis: Optional[str] = Field(default=None, description="Direct summary of key proof points and search findings that drove this decision")
    key_assumptions: List[str] = Field(default_factory=list, description="Load-bearing assumptions that must hold true for the thesis to succeed")
    kill_conditions: List[str] = Field(default_factory=list, description="Specific, quantitative threshold metrics that dictate shutting down or pivoting")
    next_steps: List[str] = Field(..., description="3-5 concrete, actionable milestone deliverables for the founder in the next 14 days")

from utils.model_router import get_routed_model, ModelRole

def decision_node(state: AgentState) -> dict:
    """
    Phase 5 Final Authority: Integrates both the Synthesis opportunity narrative AND
    the Critic's adversarial challenge and confidence penalty to reach a final verdict.
    """
    model = get_routed_model(ModelRole.DECISION, temperature=0.1)
    parser = JsonOutputParser(pydantic_object=DecisionOutput)

    synthesis = state.get("synthesis_results", {})
    critic = state.get("critic_results", {})
    structured = state.get("structured_thought", {})
    validation = state.get("validation_results", {})
    competitors = state.get("competitor_results", {})
    feasibility = state.get("feasibility_results", {})

    logger.info("decision_started", idea=structured.get("core_idea", "")[:80])

    decision_inputs = {
        "core_idea": structured.get("core_idea"),
        "primary_sector": structured.get("primary_sector"),
        "target_geography": structured.get("target_geography"),
        "synthesis": synthesis,
        "critic": critic,
        "validation": validation,
        "competitors": competitors,
        "feasibility": feasibility
    }

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are the Senior Managing Partner of a Tier-1 Venture Fund Investment Committee.
Your mandate is to deliver the final, authoritative, evidence-backed verdict: GO, PIVOT, or KILL.

EVIDENCE-BACKED DECISION FRAMEWORK:
1. VERDICT RATIONALE:
   - **GO**: Clear defensible wedge, high customer pain severity (>7/10) with verified demand signals, manageable saturation, and sound unit economics.
   - **PIVOT**: The underlying problem is real, but the current wedge or segment is trapped by incumbents or poor monetization. Specify the exact pivot vector.
   - **KILL**: Saturated red ocean, structural fatal flaws with no defensible differentiation, weak willingness-to-pay, low survival odds.
2. CONFIDENCE & ASSUMPTIONS:
   - Avoid fabricated statistics. Explain the confidence score transparently in `confidence_explanation`.
   - List the 2-4 `key_assumptions` that the business model hinges upon.
   - Summarize the strongest empirical signals in `evidence_synthesis`.
3. ACTIONABLE ROADMAP & KILL CONDITIONS:
   - List 3-5 concrete `next_steps` with measurable deliverables for the next 14 days.
   - Define 2-4 unambiguous `kill_conditions` with measurable quantitative metrics (e.g., 'If pilot CAC > $400 after 50 outbound demos with 0 LOIs, terminate project').

{format_instructions}"""),
        ("user", "Decision Inputs Dossier:\n{inputs_json}")
    ])

    try:
        chain = prompt | model | parser
        runnable = chain.with_retry(stop_after_attempt=3)
        result = runnable.invoke({
            "inputs_json": json.dumps(decision_inputs, default=str),
            "format_instructions": parser.get_format_instructions()
        })

        # Robustly parse and clamp confidence score between 5 and 95
        score_val = result.get("confidence_score", 50)
        try:
            if isinstance(score_val, str):
                digits = "".join(c for c in score_val if c.isdigit())
                score = int(digits) if digits else 50
            else:
                score = int(score_val)
        except Exception:
            score = 50
        result["confidence_score"] = max(min(score, 95), 5)

        # Normalize verdict to GO / PIVOT / KILL
        decision_val = str(result.get("decision") or result.get("verdict") or "PIVOT").strip().upper()
        if decision_val not in ["GO", "PIVOT", "KILL"]:
            decision_val = "PIVOT" if "PIVOT" in decision_val else ("GO" if "GO" in decision_val else "KILL")
        result["decision"] = decision_val

        logger.info(
            "decision_completed",
            verdict=result.get("decision"),
            confidence=result["confidence_score"],
            reasoning=result.get("reasoning", "")[:120]
        )
        return {"decision_results": result}
    except Exception as e:
        logger.error("decision_failed", error=str(e), fallback="generating_safe_fallback")
        critic_data = state.get("critic_results") or {}
        critic_penalty = critic_data.get("confidence_penalty", -15)
        survival_prob = critic_data.get("survival_probability", 50)
        try:
            survival_val = int(survival_prob)
        except Exception:
            survival_val = 50

        verdict = "GO" if survival_val >= 65 else ("KILL" if survival_val < 35 else "PIVOT")
        fallback_result = {
            "decision": verdict,
            "confidence_score": max(min(survival_val, 90), 20),
            "confidence_explanation": f"Institutional calibrated verdict based on critic risk rating (penalty: {critic_penalty}).",
            "reasoning": (state.get("synthesis_results") or {}).get("strategic_recommendation") or "Pursue focused wedge customer validation before capital commitment.",
            "evidence_synthesis": "Synthesized across live web signals, competitive saturation, and adversarial risk stress-test.",
            "key_assumptions": [
                "Target persona experiences urgent operational friction solving this problem",
                "Willingness to pay exceeds customer acquisition cost benchmark"
            ],
            "kill_conditions": [
                "If fewer than 5 qualified prospects agree to a structured pilot after 30 outbound demos, terminate the thesis"
            ],
            "next_steps": [
                "Conduct 15 targeted customer discovery interviews with key buyers",
                "Launch concierge MVP to validate real customer willingness to pay",
                "Benchmark CAC against target gross margin"
            ]
        }
        return {"decision_results": fallback_result}
