from enum import Enum
from typing import Dict, Any, Optional
from langchain_openai import ChatOpenAI
from config.config import settings
from utils.logger import logger

class ModelRole(str, Enum):
    EXTRACTION = "extraction"        # Fast: thought structuring, tags, summarization
    RESEARCH = "research"            # Medium/Fast: competitor, trend, validation
    SYNTHESIS = "synthesis"          # High capability: narrative assembly
    CRITIC = "critic"                # Deep reasoning: adversarial stress-test
    DECISION = "decision"            # Top authority: Go/Pivot/Kill judgment
    EVAL = "eval"                    # Evaluation judge

# Pricing per million tokens (approximate USD benchmark rates for tracking)
MODEL_PRICING_PER_M = {
    "gpt-5.6-luna": {"input": 1.25, "output": 5.00},
    "gpt-4o": {"input": 2.50, "output": 10.00},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "o1-preview": {"input": 15.00, "output": 60.00},
    "o1-mini": {"input": 3.00, "output": 12.00},
    "default": {"input": 0.50, "output": 1.50}
}

def get_routed_model(
    role: str = ModelRole.RESEARCH,
    temperature: float = 0.2,
    streaming: bool = False
) -> ChatOpenAI:
    """
    Dynamically routes LLM requests to the optimal model based on cognitive requirements:
    - High-stakes reasoning nodes (Critic, Decision, Synthesis) use reasoning model.
    - Research & extraction nodes use high-throughput fast model.
    """
    model_name = settings.model_fast

    if role in [ModelRole.CRITIC, ModelRole.DECISION]:
        # Heavy adversarial reasoning requires max intelligence
        model_name = settings.model_reasoning or settings.model_fast
    elif role in [ModelRole.SYNTHESIS]:
        model_name = settings.model_reasoning or settings.model_fast
    elif role in [ModelRole.EXTRACTION, ModelRole.EVAL]:
        model_name = settings.model_fast or settings.model_fallback

    logger.debug("model_routed", role=role, selected_model=model_name, temperature=temperature)

    return ChatOpenAI(
        model=model_name,
        api_key=settings.openai_api_key,
        temperature=temperature,
        streaming=streaming
    )

def estimate_cost_usd(model_name: str, prompt_tokens: int, completion_tokens: int) -> float:
    """Calculates approximate USD cost based on token counts."""
    pricing = MODEL_PRICING_PER_M.get(model_name, MODEL_PRICING_PER_M["default"])
    cost_in = (prompt_tokens / 1_000_000.0) * pricing["input"]
    cost_out = (completion_tokens / 1_000_000.0) * pricing["output"]
    return round(cost_in + cost_out, 6)
