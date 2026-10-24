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

        # Ensure confidence score is clamped between 5 and 95
        score = result.get("confidence_score", 50)
        result["confidence_score"] = max(min(int(score), 95), 5)

        logger.info(
            "decision_completed",
            verdict=result.get("decision"),
            confidence=result["confidence_score"],
            reasoning=result.get("reasoning", "")[:120]
        )
        return {"decision_results": result}
    except Exception as e:
        logger.error("decision_failed", error=str(e))
        raise e
