from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from agents.state import AgentState
from config.config import settings
from utils.logger import logger
from pydantic import BaseModel, Field
from typing import List, Optional

class Variation(BaseModel):
    title: str = Field(..., description="Compelling, specific title of the business idea variation or wedge.")
    description: str = Field(..., description="High-conviction description of how this variation works, its unique edge, and target customer.")
    target_wedge: Optional[str] = Field(default=None, description="Initial high-conversion wedge or entry niche.")
    monetization: Optional[str] = Field(default=None, description="Revenue model (e.g. usage-based, subscription, commission).")

class PivotOption(BaseModel):
    title: str = Field(..., description="Strategic pivot title.")
    rationale: str = Field(..., description="Why and when to pivot to this model if the primary thesis stalls.")

class IdeationOutput(BaseModel):
    variations: List[Variation] = Field(..., description="3-5 sharp, innovative business model variations or wedges.")
    pivot_options: List[PivotOption] = Field(..., description="2-3 strategic contingency pivots.")
    expanded_ideas: Optional[List[str]] = Field(default_factory=list, description="One-line summary bullets for backward compatibility.")

def ideation_node(state: AgentState) -> dict:
    model = ChatOpenAI(model=settings.model_fast, api_key=settings.openai_api_key, temperature=0.7)
    parser = JsonOutputParser(pydantic_object=IdeationOutput)

    structured = state.get("structured_thought", {})
    core_idea = structured.get("core_idea", state.get("raw_text", ""))
    problem = structured.get("problem_statement", "")
    audience = structured.get("target_audience", "")
    sector = structured.get("primary_sector", "")
    
    geo_tags = state.get("context_tags", {}).get("geo", [])
    geography = structured.get("target_geography")
    if geo_tags and (not geography or geography.lower() == "global"):
        geography = ", ".join(geo_tags)
    elif not geography:
        geography = "Global"

    geo_guidance = (
        f" The target market geography is specifically '{geography}'. Ensure variations and monetization are tailored to {geography}'s economic realities, local platforms, customer behaviors, and pricing power."
        if geography and geography.lower() != "global"
        else ""
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", f"""You are a world-class Startup Studio Founder and Ideation Strategist.
Brainstorm defensible, creative, and viable business model variations, wedges, and contingency pivots for this startup hypothesis.{geo_guidance}

Focus on:
- High-margin, underserved wedges
- Counter-positioning against entrenched incumbents
- Practical go-to-market hooks

{{format_instructions}}"""),
        ("user", "Core Idea: {core_idea}\nSector: {sector}\nProblem: {problem}\nAudience: {audience}\nTarget Geography: {geography}")
    ])

    logger.info("ideation_started", core_idea=core_idea[:80], geography=geography)
    
    result = (prompt | model | parser).invoke({
        "core_idea": core_idea,
        "sector": sector,
        "problem": problem,
        "audience": audience,
        "geography": geography,
        "format_instructions": parser.get_format_instructions()
    })

    # Ensure expanded_ideas list is populated for backward compatibility
    if not result.get("expanded_ideas") and result.get("variations"):
        result["expanded_ideas"] = [
            f"{v.get('title', '')}: {v.get('description', '')}"
            for v in result.get("variations", [])
            if isinstance(v, dict)
        ]
    
    logger.info("ideation_completed", 
                variations_count=len(result.get("variations", [])), 
                pivots_count=len(result.get("pivot_options", [])))
    
    return {"ideation_results": result}
