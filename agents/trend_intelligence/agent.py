from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from agents.state import AgentState
from config.config import settings
from pydantic import BaseModel, Field
from typing import List
from tools.search import search_tool
from utils.logger import logger

class TrendItem(BaseModel):
    trend: str = Field(description="Trend name")
    description: str = Field(description="Detailed explanation")
    impact: str = Field(description="How it affects the market")
    timeframe: str = Field(description="When this trend is emerging/maturing (e.g., '2024-2026', 'Mature')")
    relevance_score: int = Field(description="Relevance to the idea, 1-10")
    sources: List[dict] = Field(default_factory=list, description="Citations or reference URLs from market research with headline and url")

class TrendOutput(BaseModel):
    market_definition: str = Field(description="Precise category boundary and geography definition for the TAM (e.g. 'Global B2B AI Workflow Automation Market')")
    market_size_estimate: str = Field(description="Current market size estimate specifying base year and currency (e.g. '$6.8B in 2024')")
    market_growth_cagr: str = Field(description="Projected CAGR percentage with explicit forecast period (e.g. '15.4% CAGR (2024-2030)')")
    cagr_methodology: str = Field(description="Transparent calculation basis showing baseline value, target year projection, and underlying growth drivers")
    market_sources: List[str] = Field(default_factory=list, description="Credible industry analyst or market research references (e.g. 'Grand View Research (2024)', 'Statista', 'Gartner')")
    uncertainty_factors: List[str] = Field(default_factory=list, description="Key macroeconomic, technology, or regulatory risks that could impact growth projections")
    macro_trends: List[TrendItem] = Field(description="Broad industry/market trends")
    micro_trends: List[TrendItem] = Field(description="Niche or emerging patterns")
    key_drivers: List[str] = Field(description="Main factors driving growth")

def trend_node(state: AgentState) -> dict:
    model = ChatOpenAI(model=settings.model_fast, api_key=settings.openai_api_key)
    parser = JsonOutputParser(pydantic_object=TrendOutput)
    
    logger.info("trend_analysis_started")
    structured = state.get("structured_thought", {})
    core_idea = structured.get("core_idea", state.get("raw_text", ""))
    sector = structured.get("primary_sector", "Technology")
    
    geo_tags = state.get("context_tags", {}).get("geo", [])
    geography = structured.get("target_geography")
    if geo_tags and (not geography or geography.lower() == "global"):
        geography = ", ".join(geo_tags)
    elif not geography:
        geography = "Global"

    # Step 1: Generate Search Queries
    geo_hint = f" The focus is on the {geography} market." if geography and geography.lower() != "global" else ""
    query_prompt = ChatPromptTemplate.from_messages([
        ("system", f"You are a Trends & Market Sizing Analyst. Generate 3 specific search queries to find emerging trends, TAM estimates, credible research reports, and CAGR for this sector.{geo_hint}"),
        ("user", "Sector: {sector}\nIdea: {core_idea}\nTarget Market: {geography}")
    ])
    
    query_chain = query_prompt | model
    queries_response = query_chain.invoke({"core_idea": core_idea, "sector": sector, "geography": geography}).content
    queries = [
        q.strip().lstrip("1234567890.- ")
        for q in queries_response.splitlines()
        if q.strip() and not q.strip().lower().startswith(('here', 'sure', 'queries:'))
    ][:3]
    if not queries:
        if geography and geography.lower() != "global":
            queries = [f"{sector} market size TAM CAGR in {geography} 2025 report", f"{sector} industry growth forecast {geography}", f"emerging tech trends in {sector} {geography}"]
        else:
            queries = [f"{sector} market size TAM CAGR 2025 report", f"{sector} market growth forecast", f"emerging tech trends in {sector}"]

    logger.info("generated_queries", queries=queries, geography=geography)

    # Step 2: Execute Search
    search_results = []
    for q in queries:
        try:
            res = search_tool.run(q)
            search_results.append(f"Query: {q}\nResult: {res}")
        except Exception as e:
            logger.error("search_failed", query=q, error=str(e))
    
    combined_results = "\n\n".join(search_results)

    # Step 3: Analysis
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a Senior Market Intelligence & Quantitative Forecasting Analyst.
Analyze search results to identify market trends with rigorous, transparent market sizing and CAGR metrics.

METHODOLOGICAL REQUIREMENTS:
1. CONSISTENT MARKET DEFINITION:
   - Formulate a precise, unambiguous definition of the target TAM boundary in `market_definition`.
2. CREDIBLE SOURCES & TRANSPARENT CALCULATIONS:
   - State the market size estimate with base year and currency (e.g. '$5.2B in 2024').
   - State the projected CAGR with timeline (e.g. '14.8% CAGR (2024-2030)').
   - In `cagr_methodology`, provide transparent calculation logic showing base year value, forecast year value, and rationale.
   - In `market_sources`, cite credible industry reports (e.g. Gartner, Grand View Research, Statista, IDC, McKinsey) from search or industry standards.
   - In `uncertainty_factors`, identify 2-3 variables that could alter these projections (e.g., enterprise IT budget compression, regulatory shifts).
3. TRENDS:
   - Identify 3-4 MACRO trends (broad market shifts) and 2-3 MICRO trends (tactical/niche signals).
   - If search results mention specific articles or URLs, include them in `sources`.

{format_instructions}"""),
        ("user", "Idea: {core_idea}\nSector: {sector}\nGeography: {geography}\nSearch Context: {search_results}")
    ])

    try:
        result = (prompt | model | parser).invoke({
            "sector": sector,
            "core_idea": core_idea,
            "geography": geography,
            "search_results": combined_results,
            "format_instructions": parser.get_format_instructions()
        })
        logger.info("trend_analysis_completed", trends=len(result.get("macro_trends", [])))
        return {"trend_results": result}
    except Exception as e:
        logger.error("trend_analysis_failed", error=str(e))
        raise e
