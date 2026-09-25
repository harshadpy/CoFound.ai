from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from agents.state import AgentState
from config.config import settings
from utils.logger import logger
from pydantic import BaseModel, Field
from typing import List

class SimilarCompany(BaseModel):
    name: str
    description: str
    outcome: str = Field(..., description="Success, Failure, or Acquired")
    key_lesson: str

class SimilarityOutput(BaseModel):
    similar_companies: List[SimilarCompany]
    pattern_recognition: str = Field(..., description="Overall pattern observed.")

def similarity_node(state: AgentState) -> dict:
    # Use reasoning model for historical analysis
    model = ChatOpenAI(model=settings.model_reasoning, api_key=settings.openai_api_key)
    # o1 models don't support system messages in some versions, but LangChain handles adaptation usually.
    # However, for safety with o1-mini, we might need to use "user" role for everything or standard ChatOpenAI if it fails.
    # Let's stick to 'model_fast' (gpt-4o-mini) for now if o1 is tricky with tools/json mode, 
    # but the config says o1-mini. o1-mini doesn't support structured output/json mode well in all versions yet.
    # Safe bet: use model_fast (gpt-4o-mini) with high reasoning prompt or specific instructions. 
    # Or just use model_fast for reliability.
    
    # Update: o1-mini often rejects 'system' role. 
    # I will use model_fast (4o-mini) for now to ensure stability in this refactor.
    model = ChatOpenAI(model=settings.model_fast, api_key=settings.openai_api_key, temperature=0.1)
    
    parser = JsonOutputParser(pydantic_object=SimilarityOutput)

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a startup historian. Identify similar past startups and patterns. {format_instructions}"),
        ("user", "Core Idea: {core_idea}\nSector: {sector}")
    ])

    structured = state["structured_thought"]
    
    logger.info("similarity_analysis_started", core_idea=structured.get("core_idea"))
    
    result = (prompt | model | parser).invoke({
        "core_idea": structured.get("core_idea"),
        "sector": structured.get("primary_sector"),
        "format_instructions": parser.get_format_instructions()
    })
    
    logger.info("similarity_analysis_completed", companies_found=len(result.get("similar_companies", [])))
    
    return {"similarity_results": result}
