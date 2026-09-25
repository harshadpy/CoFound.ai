from agents.state import AgentState
from utils.logger import logger
import markdown

def report_node(state: AgentState) -> dict:
    """
    Formats the final report from state data.
    """
    logger.info("report_generation_started")
    structured = state.get("structured_thought", {})
    synthesis = state.get("synthesis_results", {})
    decision = state.get("decision_results", {})
    
    # Construct Markdown
    md_report = f"""
# CoFound.ai Market Intelligence Report
**Idea:** {structured.get('core_idea')}
**Verdict:** {decision.get('decision')} ({decision.get('confidence_score')}% Confidence)

## Executive Summary
{synthesis.get('executive_summary_narrative')}

## Problem & Market
{synthesis.get('problem_space_narrative')}

## Strategic Opportunity
{synthesis.get('market_opportunity_narrative')}

## Recommendation
{synthesis.get('strategic_recommendation')}

## Next Steps
{chr(10).join([f"- {step}" for step in decision.get('next_steps', [])])}
    """
    
    html_report = markdown.markdown(md_report)
    
    logger.info("report_generation_completed", report_length=len(md_report))
    
    return {
        "final_report_md": md_report,
        "final_report_html": html_report
    }
