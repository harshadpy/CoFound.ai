from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from agents.state import AgentState
from config.config import settings
from pydantic import BaseModel, Field
from typing import List, Optional
from tools.search import search_tool
from utils.logger import logger
import json

class CompetitorProfile(BaseModel):
    name: str = Field(description="Company name")
    description: str = Field(description="What they do")
    website: Optional[str] = Field(default=None, description="Company website URL")
    headquarters: Optional[str] = Field(default=None, description="City/Country headquarters (e.g. 'Bengaluru, India', 'San Francisco, USA')")
    funding: Optional[str] = Field(default=None, description="Funding stage or amount")
    team_size: Optional[str] = Field(default=None, description="Estimated team size")
    key_features: List[str] = Field(default_factory=list, description="Main product features")
    strengths: List[str] = Field(default_factory=list, description="Competitive advantages")
    weaknesses: List[str] = Field(default_factory=list, description="Gaps or limitations")

class CompetitorOutput(BaseModel):
    direct_competitors: List[CompetitorProfile] = Field(description="Companies offering similar solutions")
    indirect_competitors: List[CompetitorProfile] = Field(description="Alternative solutions to the same problem")
    saturation_score: int = Field(description="Market saturation 1-10, 10 being extremely saturated")
    market_insights: str = Field(description="Overall competitive landscape summary")

def competitor_node(state: AgentState) -> dict:
    model = ChatOpenAI(model=settings.model_fast, api_key=settings.openai_api_key)
    parser = JsonOutputParser(pydantic_object=CompetitorOutput)
    
    logger.info("competitor_analysis_started")
    structured = state.get("structured_thought", {})
    core_idea = structured.get("core_idea", state.get("raw_text", ""))
    sector = structured.get("primary_sector", "Technology")
    
    # Priority for geography: structured_thought target_geography -> context_tags geo -> fallback
    geo_tags = state.get("context_tags", {}).get("geo", [])
    geography = structured.get("target_geography")
    if geo_tags and (not geography or geography.lower() == "global"):
        geography = ", ".join(geo_tags)
    elif not geography:
        geography = "Global"

    logger.info("competitor_target_geography", geography=geography)

    # Step 1: Generate Search Queries with strict geographic focus
    geo_query_instruction = (
        f" The target market geography is specifically '{geography}'. All 3 search queries MUST explicitly include '{geography}' so that the search retrieves competitors operating in {geography}."
        if geography and geography.lower() != "global"
        else ""
    )

    query_prompt = ChatPromptTemplate.from_messages([
        ("system", f"You are a Market Researcher. Generate 3 specific search queries to find competitors for this idea.{geo_query_instruction}"),
        ("user", "Idea: {core_idea}\nSector: {sector}\nTarget Geography: {geography}")
    ])
    
    query_chain = query_prompt | model
    queries_response = query_chain.invoke({
        "core_idea": core_idea,
        "sector": sector,
        "geography": geography
    }).content

    queries = [
        q.strip().lstrip("1234567890.- ")
        for q in queries_response.splitlines()
        if q.strip() and not q.strip().lower().startswith(('here', 'sure', 'queries:'))
    ][:3]
    if not queries:
        if geography and geography.lower() != "global":
            queries = [
                f"{core_idea} competitors in {geography}",
                f"top {sector} startups in {geography}",
                f"{core_idea} alternatives {geography}"
            ]
        else:
            queries = [f"{core_idea} competitors", f"top startups in {sector}", f"alternatives to {core_idea}"]

    logger.info("generated_queries", queries=queries)

    # Step 2: Execute Search
    search_results = []
    for q in queries:
        try:
            res = search_tool.run(q)
            search_results.append(f"Query: {q}\nResult:\n{res}")
        except Exception as e:
            logger.error("search_failed", query=q, error=str(e))
    
    combined_results = "\n\n".join(search_results)
    
    # Step 3: Synthesize Results with Enhanced Prompt
    geo_synthesis_rule = (
        f"\nCRITICAL GEOGRAPHIC REQUIREMENT:\n"
        f"- The user specified the target geography as '{geography}'.\n"
        f"- You MUST identify competitors that are headquartered in or primarily active in '{geography}'.\n"
        f"- DO NOT provide US-only or global companies unless they have direct, prominent operations in '{geography}'.\n"
        f"- If a competitor operates in '{geography}', note their headquarters and local presence."
        if geography and geography.lower() != "global"
        else ""
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", f"""You are a Competitor Analyst. Analyze search results to identify competitors with detailed profiles.{geo_synthesis_rule}

For each competitor, provide:
- Company name and description
- Website URL (if found)
- Headquarters location (e.g. city, country)
- Funding stage/amount (if mentioned)
- Estimated team size (if available)
- Key features of their product/service
- Competitive strengths (what they do well)
- Weaknesses or gaps (opportunities for differentiation)

Identify 3-5 DIRECT competitors (similar solution) and 2-3 INDIRECT competitors (alternative approaches).
Rate market saturation 1-10 based on number and strength of competitors.
Provide market insights summary.

{{format_instructions}}"""),
        ("user", "Idea: {core_idea}\nTarget Geography: {geography}\nSearch Context:\n{search_results}")
    ])
    
    try:
        # Add retry logic for robustness
        chain = prompt | model | parser
        runnable_with_retries = chain.with_retry(stop_after_attempt=3)
        
        result = runnable_with_retries.invoke({
            "core_idea": core_idea,
            "geography": geography,
            "search_results": combined_results,
            "format_instructions": parser.get_format_instructions()
        })
        
        # Guardrail: Cross-verify extracted competitors against raw search context
        from guardrails.hallucination_checks import verify_competitor_grounding
        result = verify_competitor_grounding(result, combined_results)
        
        logger.info(
            "competitor_analysis_completed", 
            competitors=len(result.get("direct_competitors", [])),
            grounding_score=result.get("grounding_metadata", {}).get("grounding_score")
        )
        return {"competitor_results": result}
    except Exception as e:
        logger.error("competitor_analysis_failed", error=str(e))
        raise e
