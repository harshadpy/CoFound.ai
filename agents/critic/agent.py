from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from agents.state import AgentState
from config.config import settings
from utils.logger import logger
from pydantic import BaseModel, Field
from typing import List, Optional
import json

class CriticOutput(BaseModel):
    fatal_flaws: List[str] = Field(description="Top 2-4 critical flaws or structural blockers that could kill this startup")
    challenged_assumptions: List[str] = Field(description="Key founder assumptions proven weak or unvalidated by research")
    confidence_penalty: int = Field(description="Adversarial penalty points to deduct from overall confidence (negative integer between -5 and -30)")
    survival_probability: int = Field(description="Realistic 2-year survival probability percentage (0-100)")
    uncertainty_rationale: str = Field(description="Transparent explanation of key assumptions, data limitations, and sources of uncertainty")
    critical_risk_factors: List[str] = Field(default_factory=list, description="Top 3-4 specific market, capital, or execution risks")
    harsh_feedback: str = Field(description="Brutally honest, institutional-grade VC teardown of the idea")
    counter_arguments: List[str] = Field(description="Strongest counter-arguments why an investor would say NO")

from utils.model_router import get_routed_model, ModelRole

def critic_node(state: AgentState) -> dict:
    """
    Phase 4 Adversarial Guardrail: Runs strictly AFTER synthesis and parallel research.
    Critiques the synthesized market findings and applies a quantitative confidence penalty.
    """
    model = get_routed_model(ModelRole.CRITIC, temperature=0.2)
    parser = JsonOutputParser(pydantic_object=CriticOutput)

    structured = state.get("structured_thought", {})
    synthesis = state.get("synthesis_results", {})
    
    # Collect relevant research signals for the critic
    signals = {
        "idea": structured.get("core_idea"),
        "target_audience": structured.get("target_audience"),
        "problem": structured.get("problem_statement"),
        "competitor_insights": state.get("competitor_results", {}),
        "validation_signals": state.get("validation_results", {}),
        "feasibility_risks": state.get("feasibility_results", {}),
        "trend_dynamics": state.get("trend_results", {}),
        "synthesis_summary": synthesis
    }

    logger.info("critic_started", core_idea=structured.get("core_idea", "")[:80])

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a Skeptical Tier-1 Venture Capitalist and Tough Board Member.
Your mandate is to tear down this startup hypothesis by ruthlessly stress-testing the research findings and identifying unverified assumptions.

CRITICAL RIGOR & UNCERTAINTY GUIDELINES:
- Avoid fabricated statistics and unjustified pseudo-precision. Ground all skepticism in the research dossier.
- In `uncertainty_rationale`: explicitly articulate the core hypotheses being taken on faith, what data remains unverified, and the real-world variance in early-stage survival.
- In `challenged_assumptions`: highlight founder assumptions that lack web or customer evidence.
- In `fatal_flaws`: call out the 2-4 existential structural blockers (e.g., CAC/LTV imbalance, distribution bottlenecks, platform dependency, entrenched incumbents).

Calculate `confidence_penalty`:
- A negative integer between -5 and -30 reflecting how dangerous the unresolved risks are.
- Penalty should be -20 to -30 if incumbents dominate or willingness-to-pay is speculative.
- Penalty should be -5 to -15 if risks are standard and manageable.

Provide an unvarnished, direct teardown without diplomatic sugarcoating.
{format_instructions}"""),
        ("user", "Full Research Dossier & Synthesis:\n{signals_json}")
    ])

    try:
        chain = prompt | model | parser
        runnable = chain.with_retry(stop_after_attempt=3)
        result = runnable.invoke({
            "signals_json": json.dumps(signals, default=str),
            "format_instructions": parser.get_format_instructions()
        })

        # Ensure confidence_penalty is negative
        penalty = result.get("confidence_penalty", -10)
        if penalty > 0:
            penalty = -penalty
        result["confidence_penalty"] = max(min(penalty, -5), -35)

        logger.info(
            "critic_completed",
            survival_probability=result.get("survival_probability"),
            penalty=result["confidence_penalty"],
            fatal_flaws_count=len(result.get("fatal_flaws", []))
        )
        return {"critic_results": result}
    except Exception as e:
        logger.error("critic_failed", error=str(e))
        raise e
