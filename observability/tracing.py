import os
from typing import Dict, Any, List, Optional
from config.config import settings
from utils.logger import logger

def setup_langsmith_tracing() -> bool:
    """
    Configures environment variables for LangSmith / LangChain tracing.
    Returns True if LangSmith tracing is active, False otherwise.
    """
    api_key = (
        settings.langsmith_api_key
        or settings.langchain_api_key
        or os.getenv("LANGSMITH_API_KEY")
        or os.getenv("LANGCHAIN_API_KEY")
    )
    
    if not api_key:
        logger.warning("langsmith_not_configured", reason="No LANGSMITH_API_KEY or LANGCHAIN_API_KEY found")
        return False
        
    project = (
        settings.langsmith_project
        or os.getenv("LANGSMITH_PROJECT")
        or os.getenv("LANGCHAIN_PROJECT")
        or "cofound"
    )
    
    endpoint = (
        settings.langsmith_endpoint
        or os.getenv("LANGSMITH_ENDPOINT")
        or os.getenv("LANGCHAIN_ENDPOINT")
        or "https://api.smith.langchain.com"
    )
    
    # Set standard LangChain / LangSmith environment variables
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_API_KEY"] = api_key
    os.environ["LANGCHAIN_PROJECT"] = project
    os.environ["LANGCHAIN_ENDPOINT"] = endpoint
    
    # Also set LANGSMITH_* variants
    os.environ["LANGSMITH_TRACING"] = "true"
    os.environ["LANGSMITH_API_KEY"] = api_key
    os.environ["LANGSMITH_PROJECT"] = project
    os.environ["LANGSMITH_ENDPOINT"] = endpoint

    logger.info("langsmith_tracing_enabled", project=project, endpoint=endpoint)
    return True

def get_langsmith_config(
    analysis_id: str,
    user_id: str = "default_user",
    tags: Optional[List[str]] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Returns a RunnableConfig dictionary for LangGraph / LangChain invocations
    to tag and track runs cleanly in the LangSmith UI.
    """
    run_tags = ["cofound-ai", "multi-agent-system"]
    if tags:
        run_tags.extend(tags)
        
    run_metadata = {
        "analysis_id": analysis_id,
        "user_id": user_id,
        "service": "cofound-backend"
    }
    if metadata:
        run_metadata.update(metadata)
        
    return {
        "run_name": f"CoFound-Analysis-{analysis_id[:8]}",
        "tags": list(set(run_tags)),
        "metadata": run_metadata
    }
