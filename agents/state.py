from typing import TypedDict, List, Dict, Any, Optional, Annotated
import operator

class AgentState(TypedDict):
    # Inputs
    user_id: str
    analysis_id: str
    raw_text: str
    context_tags: Dict[str, Any]
    
    # Intermediate Outputs
    structured_thought: Optional[Dict[str, Any]]
    
    # Parallel Analysis Outputs
    ideation_results: Optional[Dict[str, Any]]
    similarity_results: Optional[Dict[str, Any]]
    validation_results: Optional[Dict[str, Any]]
    trend_results: Optional[Dict[str, Any]]
    competitor_results: Optional[Dict[str, Any]]
    feasibility_results: Optional[Dict[str, Any]]
    critic_results: Optional[Dict[str, Any]]
    
    # Synthesis & Decision
    synthesis_results: Optional[Dict[str, Any]]
    decision_results: Optional[Dict[str, Any]]
    
    # Final Output
    final_report_md: Optional[str]
    final_report_html: Optional[str]
