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
    timeframe: str = Field(description="When this trend is emerging/maturing")
    relevance_score: int = Field(description="Relevance to the idea, 1-10")

class TrendOutput(BaseModel):
    macro_trends: List[TrendItem] = Field(description="Broad industry/market trends")
    micro_trends: List[TrendItem] = Field(description="Niche or emerging patterns")
    market_size_estimate: str = Field(description="Current market size estimate")
    market_growth_cagr: str = Field(description="Projected CAGR percentage")
    key_drivers: List[str] = Field(description="Main factors driving growth")

def trend_node(state: AgentState) -> dict:
    model = ChatOpenAI(model=settings.model_fast, api_key=settings.openai_api_key)
    parser = JsonOutputParser(pydantic_object=TrendOutput)
    
    logger.info("trend_analysis_started")
    structured = state["structured_thought"]
    core_idea = structured.get("core_idea")
    sector = structured.get("primary_sector")

    # Step 1: Generate Search Queries
    query_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a Trends Analyst. Generate 3 specific search queries to find emerging trends and CAGR for this sector."),
        ("user", "Sector: {sector}\nIdea: {core_idea}")
    ])
    
    query_chain = query_prompt | model
    queries_response = query_chain.invoke({"core_idea": core_idea, "sector": sector}).content
    queries = [q.strip() for q in queries_response.split('\n') if q.strip() and not q.strip().startswith(('Here', 'Sure', '1.', '-'))][:3]
    if not queries:
        queries = [f"{sector} market trends 2025", f"{sector} market growth CAGR", f"emerging tech in {sector}"]

    logger.info("generated_queries", queries=queries)

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
        ("system", """You are a Future Signal Analyst. Analyze search results to identify market trends with specific metrics.

For each trend, provide:
- Trend name and detailed description
- Impact on the market/industry
- Timeframe (emerging, growing, mature)
- Relevance score 1-10 for this specific idea

Also provide:
- Market size estimate (e.g., "$5B in 2024")
- CAGR percentage (e.g., "15% CAGR 2024-2029")
- Key growth drivers

Identify 3-5 MACRO trends (broad industry) and 2-4 MICRO trends (niche patterns).

{format_instructions}"""),
        ("user", "Idea: {core_idea}\nSector: {sector}\nSearch Context: {search_results}")
    ])

    try:
        result = (prompt | model | parser).invoke({
            "sector": sector,
            "core_idea": core_idea,
            "search_results": combined_results,
            "format_instructions": parser.get_format_instructions()
        })
        logger.info("trend_analysis_completed", trends=len(result.get("macro_trends", [])))
        return {"trend_results": result}
    except Exception as e:
        logger.error("trend_analysis_failed", error=str(e))
        raise e
