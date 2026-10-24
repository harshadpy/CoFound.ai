from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from agents.state import AgentState
from config.config import settings
from utils.logger import logger
from pydantic import BaseModel, Field
from typing import List, Optional

class FeasibilityOutput(BaseModel):
    technical_stack: List[str] = Field(description="Recommended production technology stack components")
    complexity_score: int = Field(description="Build complexity rating 1-10 (10 = cutting-edge R&D/hard tech)")
    development_timeline_months: int = Field(description="Estimated MVP build timeline in months")
    key_risks: List[str] = Field(description="Core technical, regulatory, or operational delivery risks")
    monetization_model: Optional[str] = Field(default=None, description="Recommended revenue engine (e.g., 'Tiered B2B Subscription + 1.5% take rate on transactions')")
    estimated_cac_range: Optional[str] = Field(default=None, description="Realistic benchmark CAC range (e.g., '$250 - $500 per customer')")
    estimated_ltv_range: Optional[str] = Field(default=None, description="Estimated customer lifetime value (e.g., '$2,200 - $4,500 based on 2-year retention')")
    target_gross_margin: Optional[str] = Field(default=None, description="Target gross margin percentage (e.g., '75% - 82%')")
    payback_period_months: Optional[str] = Field(default=None, description="Estimated CAC payback period in months (e.g., '8 - 12 months')")
    unit_economics_summary: Optional[str] = Field(default=None, description="Concise assessment of margin sustainability, pricing power, and unit economic health")
    key_cost_drivers: List[str] = Field(default_factory=list, description="Primary operational and COGS cost drivers (e.g. AI model inference tokens, cloud data infrastructure, customer onboarding)")

def feasibility_node(state: AgentState) -> dict:
    model = ChatOpenAI(model=settings.model_fast, api_key=settings.openai_api_key, temperature=0.2)
    parser = JsonOutputParser(pydantic_object=FeasibilityOutput)

    structured = state.get("structured_thought", {})
    core_idea = structured.get("core_idea", state.get("raw_text", ""))
    sector = structured.get("primary_sector", "Technology")
    audience = structured.get("target_audience", "")
    geography = structured.get("target_geography", "Global")

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a seasoned CTO and Venture Partner assessing technical feasibility and unit economics viability.

Analyze the startup hypothesis across two key dimensions:
1. TECHNICAL EXECUTION:
   - Modern, pragmatic production tech stack components
   - Technical complexity score (1-10)
   - MVP development timeline (months)
   - 2-4 critical technical, infrastructure, or operational risks
2. BUSINESS VIABILITY & UNIT ECONOMICS:
   - Concrete monetization model suited for this audience and market
   - Realistic customer acquisition cost (CAC) benchmark range
   - Realistic customer lifetime value (LTV) benchmark range
   - Target gross margin and CAC payback period
   - Key cost drivers (e.g., AI inference, data storage, payment rails, customer success)
   - Brief synthesis of unit economic viability

Avoid arbitrary pseudo-precision: provide grounded industry benchmark ranges and explain the underlying assumptions.
{format_instructions}"""),
        ("user", "Core Idea: {core_idea}\nSector: {sector}\nTarget Customer: {audience}\nGeography: {geography}")
    ])
    
    logger.info("feasibility_started", core_idea=core_idea[:80])
    
    try:
        chain = prompt | model | parser
        result = chain.invoke({
            "core_idea": core_idea,
            "sector": sector,
            "audience": audience,
            "geography": geography,
            "format_instructions": parser.get_format_instructions()
        })
        
        logger.info(
            "feasibility_completed", 
            complexity=result.get("complexity_score"), 
            timeline_months=result.get("development_timeline_months"),
            monetization=result.get("monetization_model")
        )
        return {"feasibility_results": result}
    except Exception as e:
        logger.error("feasibility_failed", error=str(e))
        raise e
