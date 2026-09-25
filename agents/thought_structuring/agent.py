from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from agents.state import AgentState
from config.config import settings
from utils.logger import logger
from pydantic import BaseModel, Field

# Define schema for output validation
class ThoughtStructure(BaseModel):
    core_idea: str = Field(..., description="A concise summary of the user's raw thought.")
    primary_sector: str = Field(..., description="The main industry sector (e.g., HVAC, EdTech).")
    target_audience: str = Field(..., description="Who is this for? (e.g., Solo plumbers, K-12 teachers).")
    problem_statement: str = Field(..., description="The core pain point being addressed.")
    user_intent: str = Field(..., description="Is this a new idea, a pivot, or just market research?")

def thought_structuring_node(state: AgentState) -> dict:
    """
    Analyzes raw user input to extract structured intent.
    """
    model = ChatOpenAI(model=settings.model_fast, api_key=settings.openai_api_key, temperature=0.2)
    parser = JsonOutputParser(pydantic_object=ThoughtStructure)

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert product strategist. Structure this startup idea. {format_instructions}"),
        ("user", "Raw Input: {raw_text}\nContext Tags: {context_tags}")
    ])

    logger.info("thought_structuring_started", raw_text=state["raw_text"][:50])

    chain = prompt | model | parser
    
    try:
        result = chain.invoke({
            "raw_text": state["raw_text"],
            "context_tags": state["context_tags"],
            "format_instructions": parser.get_format_instructions()
        })
        logger.info("thought_structuring_completed", structured=result)
        return {"structured_thought": result}
    except Exception as e:
        logger.error("thought_structuring_failed", error=str(e))
        raise e
