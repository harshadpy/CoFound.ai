from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from agents.state import AgentState
from config.config import settings
from utils.logger import logger
from pydantic import BaseModel, Field
import json

from utils.model_router import get_routed_model, ModelRole

class SynthesisOutput(BaseModel):
    executive_summary_narrative: str
    problem_space_narrative: str
    market_opportunity_narrative: str
    strategic_recommendation: str

def synthesis_node(state: AgentState) -> dict:
    model = get_routed_model(ModelRole.SYNTHESIS, temperature=0.2)
    parser = JsonOutputParser(pydantic_object=SynthesisOutput)

    # Aggregate parallel research findings + any human steering input
    findings = {
        "structured_thought": state.get("structured_thought"),
        "ideation": state.get("ideation_results"),
        "similarity": state.get("similarity_results"),
        "validation": state.get("validation_results"),
        "trend": state.get("trend_results"),
        "competitor": state.get("competitor_results"),
        "feasibility": state.get("feasibility_results"),
        "founder_steering_input": state.get("hitl_feedback")
    }

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a Research Director. Synthesize research findings (and any direct founder steering inputs) into a coherent institutional narrative. {format_instructions}"),
        ("user", "Findings: {findings_json}")
    ])
    
    logger.info("synthesis_started", findings_count=sum(1 for v in findings.values() if v))
    
    result = (prompt | model | parser).invoke({
        "findings_json": json.dumps(findings, default=str),
        "format_instructions": parser.get_format_instructions()
    })
    
    logger.info("synthesis_completed", 
               executive_summary=result.get("executive_summary_narrative", "")[:200],
               recommendation=result.get("strategic_recommendation", "")[:200])
    
    return {"synthesis_results": result}
