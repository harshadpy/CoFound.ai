from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from agents.state import AgentState
from config.config import settings
from utils.logger import logger
from pydantic import BaseModel, Field
from typing import List

class CriticOutput(BaseModel):
    fatal_flaws: List[str]
    survival_probability: int
    harsh_feedback: str

def critic_node(state: AgentState) -> dict:
    model = ChatOpenAI(model=settings.model_reasoning, api_key=settings.openai_api_key)
    # Using model_fast if reasoning model has issues, but trying reasoning first as configured
    # Fallback to model_fast if needed via try/except in a real system, but here we assume config is correct.
    # Actually, for reliability in this script, sticking to model_fast (gpt-4o-mini) with high temp or reasoning prompt.
    model = ChatOpenAI(model=settings.model_fast, api_key=settings.openai_api_key)
    
    parser = JsonOutputParser(pydantic_object=CriticOutput)

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a VC Investor. Find fatal flaws. {format_instructions}"),
        ("user", "Idea: {core_idea}\nProblem: {problem}")
    ])

    structured = state["structured_thought"]
    
    logger.info("critic_started", core_idea=structured.get("core_idea")[:100])
    
    result = (prompt | model | parser).invoke({
        "core_idea": structured.get("core_idea"),
        "problem": structured.get("problem_statement"),
        "format_instructions": parser.get_format_instructions()
    })
    
    logger.info("critic_completed", survival_probability=result.get("survival_probability"), fatal_flaws_count=len(result.get("fatal_flaws", [])))
    
    return {"critic_results": result}
