from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from pydantic import BaseModel
import structlog

logger = structlog.get_logger()

class AgentInput(BaseModel):
    """Standard input wrapper for all agents."""
    user_id: str
    analysis_id: str
    data: Dict[str, Any]  # Flexible payload specific to the agent

class AgentOutput(BaseModel):
    """Standard output wrapper for all agents."""
    agent_name: str
    analysis_id: str
    status: str = "success"
    data: Dict[str, Any]
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class BaseAgent(ABC):
    """
    Abstract Base Class for all CoFound.ai agents.
    Enforces a strict run() interface and standard logging.
    """
    
    def __init__(self, name: str):
        self.name = name
        self.logger = logger.bind(agent=name)

    async def run(self, input_data: AgentInput) -> AgentOutput:
        """
        Main execution method. Wraps specific logic with error handling and logging.
        """
        self.logger.info("agent_start", analysis_id=input_data.analysis_id)
        
        try:
            # Execute specific agent logic
            result_data = await self._execute(input_data)
            
            output = AgentOutput(
                agent_name=self.name,
                analysis_id=input_data.analysis_id,
                status="success",
                data=result_data,
                metadata={"execution_time_ms": 0} # Placeholder for timing
            )
            
            self.logger.info("agent_success", analysis_id=input_data.analysis_id)
            return output

        except Exception as e:
            self.logger.error("agent_failure", error=str(e), exc_info=True)
            return AgentOutput(
                agent_name=self.name,
                analysis_id=input_data.analysis_id,
                status="error",
                data={},
                error=str(e)
            )

    @abstractmethod
    async def _execute(self, input_data: AgentInput) -> Dict[str, Any]:
        """
        Implement specific agent logic here.
        Must return a dictionary matching the agent's specific output schema.
        """
        pass
