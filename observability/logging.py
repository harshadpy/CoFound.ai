import structlog
from typing import Any, Dict, Optional
from utils.logger import logger

def log_agent_event(agent_name: str, event_type: str, analysis_id: Optional[str] = None, **kwargs: Any):
    """
    Standardized observability event logger for multi-agent graph nodes.
    Ties agent executions with analysis IDs for log indexing.
    """
    event_data = {
        "agent": agent_name,
        "event": event_type,
        **kwargs
    }
    if analysis_id:
        event_data["analysis_id"] = analysis_id
        
    if event_type.endswith("_failed") or "error" in event_type:
        logger.error(f"agent_{agent_name}_{event_type}", **event_data)
    else:
        logger.info(f"agent_{agent_name}_{event_type}", **event_data)
