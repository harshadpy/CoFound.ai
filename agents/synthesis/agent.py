from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from agents.state import AgentState
from config.config import settings
from utils.logger import logger
from pydantic import BaseModel, Field
import json

class SynthesisOutput(BaseModel):
    executive_summary_narrative: str
    problem_space_narrative: str
    market_opportunity_narrative: str
    strategic_recommendation: str

def synthesis_node(state: AgentState) -> dict:
    model = ChatOpenAI(model=settings.model_fast, api_key=settings.openai_api_key)
    parser = JsonOutputParser(pydantic_object=SynthesisOutput)

    # Aggregate parallel research findings
    findings = {
        "structured_thought": state.get("structured_thought"),
        "ideation": state.get("ideation_results"),
        "similarity": state.get("similarity_results"),
        "validation": state.get("validation_results"),
        "trend": state.get("trend_results"),
        "competitor": state.get("competitor_results"),
        "feasibility": state.get("feasibility_results")
    }

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a Research Director. Synthesize findings into a narrative. {format_instructions}"),
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
