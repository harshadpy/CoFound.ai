from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from agents.state import AgentState
from config.config import settings
from utils.logger import logger
from tools.search import search_service
from pydantic import BaseModel, Field
from typing import List, Optional

class ValidationSource(BaseModel):
    headline: str = Field(description="Title or headline of the referenced source or discussion")
    url: str = Field(description="Direct URL of the cited source article or community thread")
    relevance: Optional[str] = Field(default=None, description="Key finding or signal extracted from this source")

class ValidationPoint(BaseModel):
    user_segment: str = Field(description="Target persona or user segment experiencing this pain point")
    pain_point: str = Field(description="Specific, concrete friction or problem they encounter")
    severity: int = Field(description="Pain severity rating 1-10 (10 = existential / blocker)")
    quote: str = Field(description="Representative customer statement or quote illustrating the pain point")
    sentiment: str = Field(description="Sentiment: positive, neutral, or negative")
    willingness_to_pay: str = Field(description="Estimated willingness to pay: Low, Medium, High")
    evidence_type: str = Field(default="hypothesis", description="Strictly 'verified_finding' (if backed by real search data/sources) or 'hypothesis' (if an unverified market deduction)")
    sources: List[ValidationSource] = Field(default_factory=list, description="Citations and links from web research supporting this finding")
    evidence_notes: Optional[str] = Field(default=None, description="Clear explanation of assumptions, data origin, or uncertainty")

class ValidationExperiment(BaseModel):
    experiment_name: str = Field(description="Practical validation test name (e.g. 'Concierge MVP Pilot', 'Landing Page Intent Smoke Test', 'Cold Outbound Discovery')")
    method_or_channel: str = Field(description="Specific channel and execution method (e.g. 'Targeted LinkedIn InMail to 40 VP Logistics', 'Reddit r/smallbusiness survey + demo link')")
    hypothesis_tested: str = Field(description="Core assumption or pain point being validated")
    success_criteria: str = Field(description="Measurable quantitative success benchmark (e.g. '>=15% signup rate on 200 visits', '>=3 signed letters of intent with pricing')")
    timeframe_days: int = Field(default=14, description="Target execution window in days (7-21 days)")

class ValidationOutput(BaseModel):
    validation_points: List[ValidationPoint] = Field(description="Customer pain points with evidence classification")
    adoption_barriers: List[str] = Field(description="Concrete adoption hurdles (switching friction, legacy inertia, budget cycles, compliance)")
    validation_plan: List[ValidationExperiment] = Field(default_factory=list, description="Practical validation experiments with quantitative success criteria")
    overall_verdict: str = Field(description="Demand assessment: 'Strong Demand', 'Moderate Interest', or 'High Risk / Unproven'")
    data_source: str = Field(default="Real-time Web Research (Tavily)", description="Source of validation data")
    market_signals_summary: Optional[str] = Field(default=None, description="Concise synthesis of verified customer sentiment vs unvalidated assumptions")

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

    # Step 1: Real-time search for actual customer discussions & complaints
    geo_suffix = f" {geography}" if geography and geography.lower() != "global" else ""
    search_queries = [
        f"{problem} customer complaints pain points discussions{geo_suffix}",
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
        ("system", """You are a Senior User Researcher & Startup Validation Strategist.
Analyze the target idea, customer persona, and real-time internet search context (which includes industry articles, user discussions, and reported pain points).

CRITICAL GROUNDING & EVIDENCE RULES:
1. DISTINGUISH VERIFIED FINDINGS FROM HYPOTHESES:
   - If a customer pain point or quote directly reflects or is corroborated by search results/forum discussions, set `evidence_type` to "verified_finding", extract the real URL and headline into `sources`, and summarize the evidence in `evidence_notes`.
   - If an insight is an inferred hypothesis or unverified deduction, set `evidence_type` to "hypothesis", explain the underlying assumption in `evidence_notes`, and leave `sources` empty or explain why field validation is required.
   - Do NOT fabricate fake web links; use real URLs from the Search Context or leave sources empty if none exist.
2. REPRESENTATIVE CUSTOMER STATEMENTS:
   - For verified findings, provide grounded quotes or paraphrased sentiments from real discussions.
   - For hypotheses, frame the statement as a customer perspective that needs testing.
3. PRACTICAL EXPERIMENT VALIDATION PLAN:
   - Recommend 2-3 practical experiments with clear, measurable quantitative success criteria (e.g. conversion rates, minimum paid pilot commitments, CAC thresholds).
   - Timeframes should be concise (7 to 21 days).
4. ADOPTION BARRIERS:
   - Highlight 2-4 real operational or behavioral blockers (e.g. switching costs, security approval, workflow disruption).

{format_instructions}"""),
        ("user", "Core Idea: {core_idea}\nProblem: {problem}\nTarget Audience: {audience}\nTarget Geography: {geography}\n\nReal-Time Web Search Context:\n{search_context}")
    ])

    try:
        chain = prompt | model | parser
        runnable_with_retries = chain.with_retry(stop_after_attempt=3)
        result = runnable_with_retries.invoke({
            "core_idea": core_idea,
            "problem": problem,
            "audience": audience,
            "geography": geography,
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
            points_count=len(result.get("validation_points", [])),
            experiments_count=len(result.get("validation_plan", []))
        )
        return {"validation_results": result}
    except Exception as e:
        logger.error("validation_failed", error=str(e))
        raise e
