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
    primary_sector: str = Field(..., description="The main industry sector (e.g., HVAC, EdTech, B2B SaaS).")
    target_audience: str = Field(..., description="Who is this for? (e.g., Solo plumbers, K-12 teachers, Indian SMBs).")
    target_geography: str = Field(default="Global", description="Target geographic market (e.g., 'India', 'Southeast Asia', 'US', 'Global'). Extract from context_tags (especially 'geo') or raw_text.")
    problem_statement: str = Field(..., description="The core pain point being addressed.")
    user_intent: str = Field(..., description="Is this a new idea, a pivot, or just market research?")

def thought_structuring_node(state: AgentState) -> dict:
    """
    Analyzes raw user input to extract structured intent.
    """
    model = ChatOpenAI(model=settings.model_fast, api_key=settings.openai_api_key, temperature=0.2)
    parser = JsonOutputParser(pydantic_object=ThoughtStructure)

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert product strategist. Structure this startup idea. Pay close attention to context_tags (including 'geo' for target geography, 'industry', and 'segment'). {format_instructions}"),
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
        
        # Deterministic override: If user explicitly provided geography in context_tags, enforce it
        geo_tags = state.get("context_tags", {}).get("geo", [])
        if geo_tags:
            explicit_geo = ", ".join(geo_tags)
            if not result.get("target_geography") or result.get("target_geography").lower() == "global":
                result["target_geography"] = explicit_geo
            elif explicit_geo.lower() not in result.get("target_geography", "").lower():
                result["target_geography"] = f"{explicit_geo} ({result.get('target_geography')})"

        logger.info("thought_structuring_completed", structured=result)
        return {"structured_thought": result}
    except Exception as e:
        logger.error("thought_structuring_failed", error=str(e))
        raise e
