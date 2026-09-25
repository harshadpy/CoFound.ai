from agents.state import AgentState
from utils.logger import logger
import markdown

def report_node(state: AgentState) -> dict:
    """
    Phase 6 Report Generation: Formats the synthesized findings, adversarial critique,
    and final decision into Markdown and HTML formats.
    """
    logger.info("report_generation_started")
    structured = state.get("structured_thought", {})
    synthesis = state.get("synthesis_results", {})
    critic = state.get("critic_results", {})
    decision = state.get("decision_results", {})
    
    fatal_flaws_md = "\n".join([f"- **Flaw:** {flaw}" for flaw in critic.get("fatal_flaws", [])]) or "- None reported"
    assumptions_md = "\n".join([f"- {assump}" for assump in critic.get("challenged_assumptions", [])]) or "- None flagged"
    kill_conditions_md = "\n".join([f"- ⚠️ {cond}" for cond in decision.get("kill_conditions", [])]) or "- None specified"
    next_steps_md = "\n".join([f"- [ ] {step}" for step in decision.get("next_steps", [])]) or "- Validate initial assumptions"

    md_report = f"""# CoFound.ai Market Intelligence Report

**Idea:** {structured.get('core_idea', 'Startup Hypothesis')}  
**Primary Sector:** {structured.get('primary_sector', 'Technology')}  
**Institutional Verdict:** **{decision.get('decision', 'PENDING')}** ({decision.get('confidence_score', 0)}% Calibrated Confidence)  
**2-Year Survival Probability:** {critic.get('survival_probability', 'N/A')}%  

---

## 1. Executive Summary
{synthesis.get('executive_summary_narrative', 'N/A')}

---

## 2. Problem Space & Market Need
{synthesis.get('problem_space_narrative', 'N/A')}

---

## 3. Strategic Market Opportunity
{synthesis.get('market_opportunity_narrative', 'N/A')}

---

## 4. Adversarial Critic Teardown & Red Flags
> {critic.get('harsh_feedback', 'No harsh feedback recorded.')}

### Fatal Flaws & Structural Blockers
{fatal_flaws_md}

### Challenged Founder Assumptions
{assumptions_md}

---

## 5. Strategic Recommendation & Verdict Rationale
{synthesis.get('strategic_recommendation', 'N/A')}

**Verdict Rationale:**  
{decision.get('reasoning', 'N/A')}

### Kill Conditions (When to Walk Away)
{kill_conditions_md}

---

## 6. Immediate 14-Day Action Roadmap
{next_steps_md}
"""

    html_report = markdown.markdown(md_report)
    logger.info("report_generation_completed", report_length=len(md_report))

    return {
        "final_report_md": md_report,
        "final_report_html": html_report
    }
