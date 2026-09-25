from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from agents.state import AgentState
from config.config import settings
from utils.logger import logger
from pydantic import BaseModel, Field
from typing import List

class FeasibilityOutput(BaseModel):
    technical_stack: List[str]
    complexity_score: int
    development_timeline_months: int
    key_risks: List[str]

def feasibility_node(state: AgentState) -> dict:
    model = ChatOpenAI(model=settings.model_fast, api_key=settings.openai_api_key)
    parser = JsonOutputParser(pydantic_object=FeasibilityOutput)

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a CTO/COO. Assess technical complexity and risks. {format_instructions}"),
        ("user", "Idea: {core_idea}")
    ])

    structured = state["structured_thought"]
    
    logger.info("feasibility_started", core_idea=structured.get("core_idea")[:100])
    
    result = (prompt | model | parser).invoke({
        "core_idea": structured.get("core_idea"),
        "format_instructions": parser.get_format_instructions()
    })
    
    logger.info("feasibility_completed", complexity=result.get("complexity_score"), timeline_months=result.get("development_timeline_months"))
    
    return {"feasibility_results": result}
