from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from agents.state import AgentState
from config.config import settings
from utils.logger import logger
from pydantic import BaseModel, Field
from typing import List
import json

class DecisionOutput(BaseModel):
    decision: str = Field(..., description="GO, PIVOT, or KILL")
    confidence_score: int
    reasoning: str
    next_steps: List[str]

def decision_node(state: AgentState) -> dict:
    model = ChatOpenAI(model=settings.model_fast, api_key=settings.openai_api_key)
    parser = JsonOutputParser(pydantic_object=DecisionOutput)

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a VC Partner. Decide: GO, PIVOT, or KILL. {format_instructions}"),
        ("user", "Synthesis: {synthesis_json}")
    ])
    
    logger.info("decision_started")
    logger.info("synthesis_input", synthesis=state.get("synthesis_results"))
    try:
        result = (prompt | model | parser).invoke({
            "synthesis_json": json.dumps(state.get("synthesis_results"), default=str),
            "format_instructions": parser.get_format_instructions()
        })
        logger.info("decision_completed", 
                   decision=result.get("decision"), 
                   confidence=result.get("confidence_score"),
                   reasoning=result.get("reasoning"),
                   next_steps=result.get("next_steps"))
        return {"decision_results": result}
    except Exception as e:
        logger.error("decision_failed", error=str(e))
        raise e
