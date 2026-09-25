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
    harsh_feedback: str = Field(description="Brutally honest, institutional-grade VC teardown of the idea")
    counter_arguments: List[str] = Field(description="Strongest counter-arguments why an investor would say NO")

def critic_node(state: AgentState) -> dict:
    """
    Phase 4 Adversarial Guardrail: Runs strictly AFTER synthesis and parallel research.
    Critiques the synthesized market findings and applies a quantitative confidence penalty.
    """
    model = ChatOpenAI(model=settings.model_fast, api_key=settings.openai_api_key, temperature=0.2)
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
Your mandate is to tear down this startup hypothesis by ruthlessly stress-testing the research findings.

Analyze the research evidence:
- Are the competitors already too dominant or entrenched?
- Is the user willingness-to-pay convincing or merely lukewarm?
- Are the technical build complexities or hidden costs understated?
- Are the founder's core assumptions unsupported by the web data?

Calculate a 'confidence_penalty':
- A negative integer between -5 and -30 reflecting how dangerous the unresolved risks are.
- Example: If competitors are heavily entrenched and willingness-to-pay is low, penalty should be -20 to -30.
- If risks are standard and manageable, penalty should be -5 to -10.

Provide an unvarnished, direct analysis without diplomatic sugarcoating.
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
