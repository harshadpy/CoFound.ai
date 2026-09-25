from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from agents.state import AgentState
from config.config import settings
from utils.logger import logger
from pydantic import BaseModel, Field
from typing import List

class ValidationPoint(BaseModel):
    user_segment: str = Field(description="Type of user providing feedback")
    pain_point: str = Field(description="Specific problem they face")
    severity: int = Field(description="Pain severity 1-10")
    quote: str = Field(description="Simulated user quote")
    sentiment: str = Field(description="positive, neutral, or negative")
    willingness_to_pay: str = Field(description="Low, Medium, High")

class ValidationOutput(BaseModel):
    validation_points: List[ValidationPoint] = Field(description="User feedback points")
    adoption_barriers: List[str] = Field(description="Obstacles to adoption")
    overall_verdict: str = Field(description="Strong Demand, Moderate Interest, or Risky")
    data_source: str = Field(default="AI-Simulated", description="Indicates this is simulated user feedback, not real interviews")

def validation_node(state: AgentState) -> dict:
    model = ChatOpenAI(model=settings.model_fast, api_key=settings.openai_api_key, temperature=0.3)
    parser = JsonOutputParser(pydantic_object=ValidationOutput)

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a User Research Expert. **SIMULATE** realistic user feedback for this idea based on typical user research patterns.

⚠️ IMPORTANT: This is SIMULATED data for initial market hypothesis, NOT real user interviews.

For each validation point, provide:
- User segment (e.g., "Small business owner", "Enterprise CTO")
- Specific pain point they face
- Pain severity rating 1-10
- Realistic user quote expressing their view (clearly simulated)
- Sentiment (positive, neutral, negative)
- Willingness to pay (Low, Medium, High)

Also identify:
- Adoption barriers (cost, complexity, trust, etc.)
- Overall verdict: Strong Demand, Moderate Interest, or Risky

Provide 3-5 diverse validation points covering different user perspectives.
Base your simulation on common patterns in similar markets, but make it clear this is hypothesis, not fact.

{format_instructions}"""),
        ("user", "Problem: {problem}\\nTarget Audience: {audience}")
    ])

    structured = state["structured_thought"]
    
    logger.info("validation_started", problem=structured.get("problem_statement")[:100])
    
    result = (prompt | model | parser).invoke({
        "problem": structured.get("problem_statement"),
        "audience": structured.get("target_audience"),
        "format_instructions": parser.get_format_instructions()
    })
    
    logger.info("validation_completed", verdict=result.get("overall_verdict"), points_count=len(result.get("validation_points", [])))
    
    return {"validation_results": result}
