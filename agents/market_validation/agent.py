from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from agents.state import AgentState
from config.config import settings
from utils.logger import logger
from tools.search import search_service
from pydantic import BaseModel, Field
from typing import List, Optional

class ValidationPoint(BaseModel):
    user_segment: str = Field(description="Type of user providing feedback")
    pain_point: str = Field(description="Specific problem they face")
    severity: int = Field(description="Pain severity 1-10")
    quote: str = Field(description="Representative user feedback or quote derived from online discussions")
    sentiment: str = Field(description="positive, neutral, or negative")
    willingness_to_pay: str = Field(description="Low, Medium, High")

class ValidationOutput(BaseModel):
    validation_points: List[ValidationPoint] = Field(description="User feedback points synthesized from market signals")
    adoption_barriers: List[str] = Field(description="Obstacles to adoption (switching costs, trust, pricing)")
    overall_verdict: str = Field(description="Strong Demand, Moderate Interest, or Risky")
    data_source: str = Field(default="Real-time Web Research (Tavily)", description="Source of validation data")
    market_signals_summary: Optional[str] = Field(default=None, description="Summary of real user discussions and sentiment found online")

def validation_node(state: AgentState) -> dict:
    model = ChatOpenAI(model=settings.model_fast, api_key=settings.openai_api_key, temperature=0.2)
    parser = JsonOutputParser(pydantic_object=ValidationOutput)

    structured = state.get("structured_thought", {})
    problem = structured.get("problem_statement", "")
    audience = structured.get("target_audience", "")
    core_idea = structured.get("core_idea", state.get("raw_text", ""))
    
    geo_tags = state.get("context_tags", {}).get("geo", [])
    geography = structured.get("target_geography")
    if geo_tags and (not geography or geography.lower() == "global"):
        geography = ", ".join(geo_tags)
    elif not geography:
        geography = "Global"
    
    logger.info("validation_started", problem=problem[:100], geography=geography)

    # Step 1: Real-time search for actual user discussions & complaints
    geo_suffix = f" {geography}" if geography and geography.lower() != "global" else ""
    search_queries = [
        f"{problem} complaints issues user feedback{geo_suffix}",
        f"{audience} biggest challenges with {core_idea}{geo_suffix}"
    ]
    
    search_snippets = []
    for q in search_queries:
        try:
            res = search_service.search(q, max_results=3, search_depth="basic")
            search_snippets.append(f"Search Query: {q}\n{res}")
        except Exception as e:
            logger.warning("validation_search_failed", query=q, error=str(e))

    combined_search_context = "\n\n".join(search_snippets)

    # Step 2: Synthesize findings into structured validation output
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a Lead User Research & Market Validation Expert.
Analyze both the target problem and the provided real-time internet search context (which includes forum posts, articles, and user complaints) to synthesize market validation signals.

For each validation point:
- User segment (e.g., "Small business owner", "Enterprise CTO", "Indie developer")
- Specific pain point they actually face based on evidence
- Pain severity rating 1-10
- Representative user quote expressing their perspective
- Sentiment (positive, neutral, negative)
- Willingness to pay (Low, Medium, High)

Also identify:
- Real adoption barriers (inertia, pricing, integration friction, compliance)
- Overall verdict: Strong Demand, Moderate Interest, or Risky
- Summary of market signals observed from search

Provide 3-5 grounded validation points.

{format_instructions}"""),
        ("user", "Core Idea: {core_idea}\nProblem: {problem}\nTarget Audience: {audience}\n\nReal-Time Web Search Context:\n{search_context}")
    ])

    try:
        chain = prompt | model | parser
        runnable_with_retries = chain.with_retry(stop_after_attempt=3)
        result = runnable_with_retries.invoke({
            "core_idea": core_idea,
            "problem": problem,
            "audience": audience,
            "search_context": combined_search_context or "No search results available. Synthesizing based on market heuristics.",
            "format_instructions": parser.get_format_instructions()
        })
        
        # Tag data source accurately
        if search_service.is_tavily_active:
            result["data_source"] = "Real-time Web Research (Tavily AI Search)"
        else:
            result["data_source"] = "Real-time Web Research (DuckDuckGo)"

        logger.info(
            "validation_completed",
            verdict=result.get("overall_verdict"),
            points_count=len(result.get("validation_points", []))
        )
        return {"validation_results": result}
    except Exception as e:
        logger.error("validation_failed", error=str(e))
        raise e
