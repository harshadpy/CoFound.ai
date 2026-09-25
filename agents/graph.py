from langgraph.graph import StateGraph, END
from agents.state import AgentState
from utils.logger import logger

# Import nodes
from agents.thought_structuring.agent import thought_structuring_node
from agents.ideation.agent import ideation_node
from agents.similarity_pattern.agent import similarity_node
from agents.market_validation.agent import validation_node
from agents.trend_intelligence.agent import trend_node
from agents.competitor_analysis.agent import competitor_node
from agents.feasibility.agent import feasibility_node
from agents.critic.agent import critic_node
from agents.synthesis.agent import synthesis_node
from agents.decision.agent import decision_node
from agents.report_generation.agent import report_node

def create_workflow():
    workflow = StateGraph(AgentState)
    
    # Phase 1: Entry & Structuring
    workflow.add_node("structure", thought_structuring_node)
    
    # Phase 2: Parallel Research Nodes (isolated, no cross-talk)
    workflow.add_node("ideation", ideation_node)
    workflow.add_node("similarity", similarity_node)
    workflow.add_node("validation", validation_node)
    workflow.add_node("trend", trend_node)
    workflow.add_node("competitor", competitor_node)
    workflow.add_node("feasibility", feasibility_node)
    
    # Phase 3: Synthesis (First merge point)
    workflow.add_node("synthesis", synthesis_node)
    
    # Phase 4: Adversarial Guardrail (Critic runs strictly after synthesis & research)
    workflow.add_node("critic", critic_node)
    
    # Phase 5: Final Decision (Authority)
    workflow.add_node("decision", decision_node)
    
    # Phase 6: Report Generation
    workflow.add_node("report", report_node)
    
    # ─── Edges ────────────────────────────────────────────────────────
    # Start -> Structure
    workflow.set_entry_point("structure")
    
    # Structure -> 6 Parallel Research Nodes
    research_nodes = ["ideation", "similarity", "validation", "trend", "competitor", "feasibility"]
    for node in research_nodes:
        workflow.add_edge("structure", node)
    
    # 6 Parallel Research Nodes -> Synthesis
    for node in research_nodes:
        workflow.add_edge(node, "synthesis")
        
    # Synthesis -> Adversarial Critic (Phase 4 Guardrail)
    workflow.add_edge("synthesis", "critic")
    
    # Critic -> Decision (Phase 5 Authority)
    workflow.add_edge("critic", "decision")
    
    # Decision -> Report
    workflow.add_edge("decision", "report")
    
    # Report -> End
    workflow.add_edge("report", END)
    
    return workflow.compile()

# Singleton graph instance
app = create_workflow()
