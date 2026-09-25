from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from agents.state import AgentState
from config.config import settings
from utils.logger import logger
from pydantic import BaseModel, Field
from typing import List

class IdeationOutput(BaseModel):
    expanded_ideas: List[str] = Field(..., description="List of 3-5 variations or expansions of the core idea.")
    pivot_options: List[str] = Field(..., description="Potential pivots if the original idea fails.")

def ideation_node(state: AgentState) -> dict:
    model = ChatOpenAI(model=settings.model_fast, api_key=settings.openai_api_key, temperature=0.7)
    parser = JsonOutputParser(pydantic_object=IdeationOutput)

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a creative startup mentor. Brainstorm variations and pivots. {format_instructions}"),
        ("user", "Core Idea: {core_idea}\nProblem: {problem}\nAudience: {audience}")
    ])

    structured = state["structured_thought"]
    
    logger.info("ideation_started", core_idea=structured.get("core_idea"))
    
    result = chain = (prompt | model | parser).invoke({
        "core_idea": structured.get("core_idea"),
        "problem": structured.get("problem_statement"),
        "audience": structured.get("target_audience"),
        "format_instructions": parser.get_format_instructions()
    })
    
    logger.info("ideation_completed", ideas_count=len(result.get("expanded_ideas", [])), pivots_count=len(result.get("pivot_options", [])))
    
    return {"ideation_results": result}
