import asyncio
from typing import Dict, Any
from agents.thought_structuring.agent import ThoughtStructuringAgent
from agents.ideation.agent import IdeationAgent
from agents.similarity_pattern.agent import SimilarityPatternAgent
from agents.market_validation.agent import MarketValidationAgent
from agents.trend_intelligence.agent import TrendIntelligenceAgent
from agents.competitor_analysis.agent import CompetitorAnalysisAgent
from agents.feasibility.agent import FeasibilityAgent
from agents.critic.agent import CriticAgent
from agents.decision.agent import DecisionAgent
from agents.synthesis.agent import SynthesisAgent
from agents.report_generation.agent import ReportGenerationAgent
from agents.base_agent import AgentInput

class Orchestrator:
    def __init__(self):
        self.agents = {
            "structuring": ThoughtStructuringAgent(),
            "ideation": IdeationAgent(),
            "similarity": SimilarityPatternAgent(),
            "validation": MarketValidationAgent(),
            "trend": TrendIntelligenceAgent(),
            "competitor": CompetitorAnalysisAgent(),
            "feasibility": FeasibilityAgent(),
            "critic": CriticAgent(),
            "synthesis": SynthesisAgent(),
            "decision": DecisionAgent(),
            "report": ReportGenerationAgent(),
        }

    async def run_analysis(self, user_id: str, analysis_id: str, raw_text: str, context_tags: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes the full agentic workflow.
        """
        # Step 1: Structure the thought
        input_base = AgentInput(user_id=user_id, analysis_id=analysis_id, data={"raw_text": raw_text, "context_tags": context_tags})
        structuring_output = await self.agents["structuring"].run(input_base)
        structured_thought = structuring_output.data
        
        # Step 2: Parallel Analysis
        # All these agents need the structured thought throughout
        parallel_input_data = {"structured_thought": structured_thought}
        parallel_input = AgentInput(user_id=user_id, analysis_id=analysis_id, data=parallel_input_data)
        
        # Parallel execution
        results = await asyncio.gather(
            self.agents["ideation"].run(parallel_input),
            self.agents["similarity"].run(parallel_input),
            self.agents["validation"].run(parallel_input),
            self.agents["trend"].run(parallel_input),
            self.agents["competitor"].run(parallel_input),
            self.agents["feasibility"].run(parallel_input),
            self.agents["critic"].run(parallel_input)
        )
        
        # Unpack results
        analysis_results = {
            "ideation": results[0].data,
            "similarity": results[1].data,
            "validation": results[2].data,
            "trend": results[3].data,
            "competitor": results[4].data,
            "feasibility": results[5].data,
            "critic": results[6].data
        }
        
        # Step 3: Synthesis
        synthesis_input = AgentInput(
            user_id=user_id, 
            analysis_id=analysis_id, 
            data={**analysis_results, "structured_thought": structured_thought}
        )
        synthesis_output = await self.agents["synthesis"].run(synthesis_input)
        
        # Step 4: Decision
        decision_input = AgentInput(
            user_id=user_id,
            analysis_id=analysis_id,
            data=synthesis_output.data # Pass synthesis data for high-level decision
        )
        decision_output = await self.agents["decision"].run(decision_input)
        
        # Step 5: Report Generation
        report_input = AgentInput(
            user_id=user_id,
            analysis_id=analysis_id,
            data={
                "synthesis": synthesis_output.data,
                "decision": decision_output.data,
                "structured_thought": structured_thought
            }
        )
        report_output = await self.agents["report"].run(report_input)
        
        return {
            "analysis_id": analysis_id,
            "structured_thought": structured_thought,
            "analysis_results": analysis_results,
            "synthesis": synthesis_output.data,
            "decision": decision_output.data,
            "report": report_output.data
        }
