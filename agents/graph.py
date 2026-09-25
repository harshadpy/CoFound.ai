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
    
    # Add nodes
    workflow.add_node("structure", thought_structuring_node)
    
    # Parallel branch nodes
    workflow.add_node("ideation", ideation_node)
    workflow.add_node("similarity", similarity_node)
    workflow.add_node("validation", validation_node)
    workflow.add_node("trend", trend_node)
    workflow.add_node("competitor", competitor_node)
    workflow.add_node("feasibility", feasibility_node)
    workflow.add_node("critic", critic_node)
    
    # Synthesis & Decision
    workflow.add_node("synthesis", synthesis_node)
    workflow.add_node("decision", decision_node)
    workflow.add_node("report", report_node)
    
    # Define edges
    # Start -> Structure
    workflow.set_entry_point("structure")
    
    # Structure -> Parallel Nodes
    # We fan out to all analysis nodes
    parallel_nodes = ["ideation", "similarity", "validation", "trend", "competitor", "feasibility", "critic"]
    for node in parallel_nodes:
        workflow.add_edge("structure", node)
    
    # Parallel Nodes -> Synthesis
    # All analysis nodes must finish before synthesis
    for node in parallel_nodes:
        workflow.add_edge(node, "synthesis")
        
    # Synthesis -> Decision
    workflow.add_edge("synthesis", "decision")
    
    # Decision -> Report
    workflow.add_edge("decision", "report")
    
    # Report -> End
    workflow.add_edge("report", END)
    
    return workflow.compile()

# Singleton graph instance
app = create_workflow()
