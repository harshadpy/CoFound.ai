from agents.state import AgentState
from utils.logger import logger
import markdown

def report_node(state: AgentState) -> dict:
    """
    Phase 6 Report Generation: Formats the synthesized findings, evidence-driven market signals,
    competitor differentiation, unit economics, adversarial critique, and final decision into
    professional Markdown and HTML formats.
    """
    logger.info("report_generation_started")
    structured = state.get("structured_thought", {})
    synthesis = state.get("synthesis_results", {})
    critic = state.get("critic_results", {})
    decision = state.get("decision_results", {})
    validation = state.get("validation_results", {})
    competitors = state.get("competitor_results", {})
    trends = state.get("trend_results", {})
    feasibility = state.get("feasibility_results", {})
    
    fatal_flaws_md = "\n".join([f"- **Flaw:** {flaw}" for flaw in critic.get("fatal_flaws", [])]) or "- None reported"
    assumptions_md = "\n".join([f"- {assump}" for assump in critic.get("challenged_assumptions", [])]) or "- None flagged"
    kill_conditions_md = "\n".join([f"- ⚠️ **{cond}**" for cond in decision.get("kill_conditions", [])]) or "- None specified"
    next_steps_md = "\n".join([f"- [ ] {step}" for step in decision.get("next_steps", [])]) or "- Validate initial assumptions"

    # Format Market Signals (Verified vs Hypotheses)
    val_points = validation.get("validation_points", [])
    val_points_md_list = []
    for vp in val_points:
        is_verified = vp.get("evidence_type") == "verified_finding" or len(vp.get("sources", [])) > 0
        tag = "✅ **[VERIFIED FINDING]**" if is_verified else "💡 **[HYPOTHESIS - NEEDS FIELD TEST]**"
        sources_str = ""
        if vp.get("sources"):
            sources_str = "\n  - *Sources:* " + ", ".join([f"[{s.get('headline', 'Source')}]({s.get('url', '#')})" for s in vp.get("sources", []) if s.get('url')])
        notes_str = f"\n  - *Evidence note:* {vp.get('evidence_notes')}" if vp.get("evidence_notes") else ""
        quote_str = f"\n  - *Quote/Discussion:* \"{vp.get('quote')}\"" if vp.get("quote") else ""
        val_points_md_list.append(
            f"- {tag} **{vp.get('user_segment', 'Segment')}:** {vp.get('pain_point', '')}\n"
            f"  - *Severity:* {vp.get('severity', 'N/A')}/10 | *Willingness to Pay:* {vp.get('willingness_to_pay', 'Medium')}{quote_str}{sources_str}{notes_str}"
        )
    val_points_md = "\n".join(val_points_md_list) or "- No specific user signals recorded."

    # Format Validation Experiments Plan
    exp_plan = validation.get("validation_plan", [])
    exp_md_list = []
    for exp in exp_plan:
        exp_md_list.append(
            f"- **{exp.get('experiment_name', 'Test')}** ({exp.get('timeframe_days', 14)} days)\n"
            f"  - *Method/Channel:* {exp.get('method_or_channel', 'Outbound')}\n"
            f"  - *Hypothesis Tested:* {exp.get('hypothesis_tested', 'Core demand')}\n"
            f"  - *Measurable Success Benchmark:* **{exp.get('success_criteria', 'Target conversion')}**"
        )
    val_plan_md = "\n".join(exp_md_list) or "- Conduct 10 structured customer discovery interviews with target buyers."

    # Format Competitor Gaps & Differentiation
    market_gaps = competitors.get("market_gaps", [])
    gaps_md = "\n".join([f"- **Market Gap:** {g}" for g in market_gaps]) or "- Incremental execution advantage needed."
    diff_playbook = competitors.get("differentiation_playbook", [])
    diff_md = "\n".join([f"- **Differentiation Angle:** {d}" for d in diff_playbook]) or "- Fast time-to-value and specialized workflow."

    # Format Unit Economics & Business Viability
    unit_econ_md = (
        f"- **Monetization Engine:** {feasibility.get('monetization_model', 'Subscription SaaS')}\n"
        f"- **Estimated CAC Benchmark:** {feasibility.get('estimated_cac_range', 'N/A')}\n"
        f"- **Estimated LTV Benchmark:** {feasibility.get('estimated_ltv_range', 'N/A')}\n"
        f"- **Target Gross Margin:** {feasibility.get('target_gross_margin', '75% - 85%')}\n"
        f"- **Payback Period:** {feasibility.get('payback_period_months', '9-12')} months\n"
        f"- **Key Cost Drivers:** {', '.join(feasibility.get('key_cost_drivers', [])) or 'Hosting, sales acquisition, compute'}"
    )

    # Format Market & CAGR
    cagr_sources = ", ".join(trends.get("market_sources", [])) or "Industry analyst estimates"
    market_sizing_md = (
        f"- **Market Definition:** {trends.get('market_definition', structured.get('primary_sector', 'Emerging Market'))}\n"
        f"- **Estimated Market Size (TAM):** {trends.get('market_size_estimate', 'N/A')}\n"
        f"- **Projected Growth (CAGR):** {trends.get('market_growth_cagr', 'N/A')}\n"
        f"- **Calculation Methodology:** {trends.get('cagr_methodology', 'Compounded annual forecast based on industry drivers.')}\n"
        f"- **Credible Sources:** {cagr_sources}"
    )

    md_report = f"""# CoFound.ai Institutional Market Intelligence Report

**Hypothesis:** {structured.get('core_idea', 'Startup Hypothesis')}  
**Primary Sector:** {structured.get('primary_sector', 'Technology')} | **Target Geography:** {structured.get('target_geography', 'Global')}  
**Institutional Verdict:** **{decision.get('decision', 'PENDING')}** ({decision.get('confidence_score', 0)}% Calibrated Confidence)  
**2-Year Survival Probability:** {critic.get('survival_probability', 'N/A')}%  

---

## 1. Executive Summary & Verdict Rationale
{synthesis.get('executive_summary_narrative', 'N/A')}

**Verdict Rationale:**  
{decision.get('reasoning', 'N/A')}

**Key Empirical Proof Points:**  
{decision.get('evidence_synthesis', 'Synthesized across live web signals and competitive saturation.')}

---

## 2. Market Sizing & CAGR Methodology
{market_sizing_md}

---

## 3. Sourced Market Signals & Customer Pain Points
*Findings grounded in real-time customer discussions and web intelligence:*
{val_points_md}

### Adoption & Operational Barriers
{chr(10).join([f"- ⚠️ {b}" for b in validation.get('adoption_barriers', [])]) or "- Switching inertia and legacy procurement cycles."}

---

## 4. Competitive Landscape, Market Gaps & Differentiation
**Market Saturation:** {competitors.get('saturation_score', 'N/A')}/10  
{competitors.get('market_insights', '')}

### Identified Structural Market Gaps
{gaps_md}

### Defensible Differentiation Playbook
{diff_md}

---

## 5. Business Viability & Unit Economics
{unit_econ_md}

---

## 6. Adversarial Critic Teardown & Uncertainty Analysis
> {critic.get('harsh_feedback', 'No harsh feedback recorded.')}

### Fatal Flaws & Structural Blockers
{fatal_flaws_md}

### Challenged Founder Assumptions
{assumptions_md}

### Uncertainty & Data Limitations
{critic.get('uncertainty_rationale', 'Early-stage hypotheses require field customer validation.')}

### Kill Conditions (When to Walk Away)
{kill_conditions_md}

---

## 7. Practical Validation Plan (Measurable Experiments)
{val_plan_md}

---

## 8. Immediate 14-Day Action Roadmap
{next_steps_md}
"""

    html_report = markdown.markdown(md_report)
    logger.info("report_generation_completed", report_length=len(md_report))

    return {
        "final_report_md": md_report,
        "final_report_html": html_report
    }
