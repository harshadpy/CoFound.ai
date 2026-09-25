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
    confidence_score: int = Field(..., description="Calibrated confidence score (0-100), penalized by critic risks")
    reasoning: str = Field(..., description="Executive verdict reasoning balancing market opportunity against fatal flaws")
    next_steps: List[str] = Field(..., description="3-5 concrete action items for the founder in the next 14 days")
    kill_conditions: List[str] = Field(default_factory=list, description="Specific threshold metrics that, if failed, dictate shutting down the project")

def decision_node(state: AgentState) -> dict:
    """
    Phase 5 Final Authority: Integrates both the Synthesis opportunity narrative AND
    the Critic's adversarial challenge and confidence penalty to reach a final verdict.
    """
    model = ChatOpenAI(model=settings.model_fast, api_key=settings.openai_api_key, temperature=0.1)
    parser = JsonOutputParser(pydantic_object=DecisionOutput)

    synthesis = state.get("synthesis_results", {})
    critic = state.get("critic_results", {})
    structured = state.get("structured_thought", {})

    logger.info("decision_started", idea=structured.get("core_idea", "")[:80])

    decision_inputs = {
        "core_idea": structured.get("core_idea"),
        "primary_sector": structured.get("primary_sector"),
        "synthesis": synthesis,
        "critic": critic
    }

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are the Senior Managing Partner of a Top Venture Fund.
Your mandate is to deliver the final, authoritative investment committee verdict: GO, PIVOT, or KILL.

You must balance:
1. The Synthesis (Strategic opportunity, demand, market size).
2. The Critic's Adversarial Guardrail (Fatal flaws, challenged assumptions, survival probability, and confidence penalty).

Rules for Verdict:
- **GO**: Clear defensibility, strong willingness-to-pay, manageable competition, high survival probability (>60%).
- **PIVOT**: The core pain point is real, but the current execution or target segment is trapped (e.g. entrenched incumbents, poor unit economics). Needs repositioning.
- **KILL**: Saturated market, fatal flaws with no viable wedge, near-zero willingness-to-pay, low survival probability (<35%).

Rules for Confidence Score:
- Calculate a base confidence score (0-100).
- Apply the Critic's confidence penalty directly (e.g. base 80 + penalty -15 = 65).
- Ensure the final confidence_score accurately reflects real-world survival odds.

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
