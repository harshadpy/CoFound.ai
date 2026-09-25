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
    structured = state["structured_thought"]
    core_idea = structured.get("core_idea")
    sector = structured.get("primary_sector")

    # Step 1: Generate Search Queries
    query_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a Market Researcher. Generate 3 specific search queries to find competitors for this idea."),
        ("user", "Idea: {core_idea}\\nSector: {sector}")
    ])
    
    query_chain = query_prompt | model
    queries_response = query_chain.invoke({"core_idea": core_idea, "sector": sector}).content
    # Simple splitting heuristic
    queries = [q.strip() for q in queries_response.split('\\n') if q.strip() and not q.strip().startswith(('Here', 'Sure', '1.', '-'))][:3]
    if not queries:
        queries = [f"{core_idea} competitors", f"top startups in {sector}", f"alternatives to {core_idea}"]

    logger.info("generated_queries", queries=queries)

    # Step 2: Execute Search
    search_results = []
    for q in queries:
        try:
            res = search_tool.run(q)
            search_results.append(f"Query: {q}\\nResult: {res}")
        except Exception as e:
            logger.error("search_failed", query=q, error=str(e))
    
    combined_results = "\\n\\n".join(search_results)
    
    # Step 3: Synthesize Results with Enhanced Prompt
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a Competitor Analyst. Analyze search results to identify competitors with detailed profiles.

For each competitor, provide:
- Company name and description
- Website URL (if found)
- Funding stage/amount (if mentioned)
- Estimated team size (if available)
- Key features of their product/service
- Competitive strengths (what they do well)
- Weaknesses or gaps (opportunities for differentiation)

Identify 3-5 DIRECT competitors (similar solution) and 2-3 INDIRECT competitors (alternative approaches).
Rate market saturation 1-10 based on number and strength of competitors.
Provide market insights summary.

{format_instructions}"""),
        ("user", "Idea: {core_idea}\\nSearch Context: {search_results}")
    ])
    
    try:
        # Add retry logic for robustness
        chain = prompt | model | parser
        runnable_with_retries = chain.with_retry(stop_after_attempt=3)
        
        result = runnable_with_retries.invoke({
            "core_idea": core_idea,
            "search_results": combined_results,
            "format_instructions": parser.get_format_instructions()
        })
        logger.info("competitor_analysis_completed", competitors=len(result.get("direct_competitors", [])))
        return {"competitor_results": result}
    except Exception as e:
        logger.error("competitor_analysis_failed", error=str(e))
        raise e
