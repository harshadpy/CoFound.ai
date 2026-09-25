import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, Circle, AlertCircle, Lightbulb, Users, TrendingUp, Target, Wrench, AlertTriangle, Search as SearchIcon, Zap, FileCheck } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ActiveAnalysis() {
    const { currentAnalysisId, analysisStatus, pollStatus, agentStatuses, agentMetrics, progressPercentage } = useStore();
    const navigate = useNavigate();
    const bottomRef = useRef(null);

    // Agent definitions with icons and descriptions
    const agents = [
        { id: 'structure', label: 'Thought Structuring', icon: Zap, desc: 'Analyzing core idea' },
        { id: 'ideation', label: 'Ideation', icon: Lightbulb, desc: 'Generating variations' },
        { id: 'similarity', label: 'Similarity Analysis', icon: SearchIcon, desc: 'Finding patterns' },
        { id: 'validation', label: 'Market Validation', icon: Users, desc: 'User feedback' },
        { id: 'feasibility', label: 'Feasibility', icon: Wrench, desc: 'Technical assessment' },
        { id: 'critic', label: 'Critic', icon: AlertTriangle, desc: 'Finding flaws' },
        { id: 'competitor', label: 'Competitor Analysis', icon: Target, desc: 'Researching rivals' },
        { id: 'trend', label: 'Trend Intelligence', icon: TrendingUp, desc: 'Market trends' },
        { id: 'synthesis', label: 'Synthesis', icon: FileCheck, desc: 'Combining insights' },
        { id: 'decision', label: 'Decision Engine', icon: CheckCircle2, desc: 'Final verdict' },
        { id: 'report', label: 'Report Generation', icon: FileCheck, desc: 'Compiling report' }
    ];

    useEffect(() => {
        if (!currentAnalysisId) {
            navigate('/');
            return;
        }

        const interval = setInterval(async () => {
            const status = await pollStatus(currentAnalysisId);

            if (status === "completed") {
                clearInterval(interval);
                setTimeout(() => navigate('/report'), 1000);
            } else if (status === "failed") {
                clearInterval(interval);
            }
        }, 2000); // Poll every 2 seconds

        return () => clearInterval(interval);
    }, [currentAnalysisId, navigate, pollStatus]);

    const getAgentStatus = (agentId) => {
        return agentStatuses[agentId] || 'pending';
    };

    const getStatusIcon = (status) => {
        if (status === 'completed') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
        if (status === 'running') return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
        return <Circle className="w-5 h-5 text-slate-300" />;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 py-12 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/50 border border-blue-100/50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm backdrop-blur-sm">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                        </span>
                        Agent Swarm Active
                    </div>
                    <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Generating Intelligence Report</h2>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                        Orchestrating <span className="font-semibold text-blue-600">11 autonomous agents</span> to research, analyze, and validate your startup concept.
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-8 max-w-md mx-auto">
                        <div className="flex justify-between text-sm font-medium text-slate-600 mb-2">
                            <span>Overall Progress</span>
                            <span>{progressPercentage}%</span>
                        </div>
                        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Agent Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agents.map((agent) => {
                        const status = getAgentStatus(agent.id);
                        const Icon = agent.icon;
                        const isActive = status === 'running';
                        const isCompleted = status === 'completed';

                        return (
                            <div
                                key={agent.id}
                                className={cn(
                                    "relative p-5 rounded-xl border transition-all duration-300",
                                    isActive && "bg-white border-blue-200 shadow-lg shadow-blue-100 ring-2 ring-blue-100",
                                    isCompleted && "bg-emerald-50/50 border-emerald-200",
                                    !isActive && !isCompleted && "bg-white border-slate-200 opacity-60"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "p-2 rounded-lg transition-colors",
                                        isActive && "bg-blue-100 text-blue-600",
                                        isCompleted && "bg-emerald-100 text-emerald-600",
                                        !isActive && !isCompleted && "bg-slate-100 text-slate-400"
                                    )}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-semibold text-sm text-slate-900 truncate">{agent.label}</h3>
                                            {getStatusIcon(status)}
                                        </div>
                                        <p className="text-xs text-slate-500">{agent.desc}</p>
                                        {isActive && (
                                            <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                <span>Processing...</span>
                                            </div>
                                        )}
                                        {isCompleted && agentMetrics[agent.id] && (
                                            <div className="mt-2 text-xs text-emerald-600 font-medium">
                                                ✓ {agentMetrics[agent.id]}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Status Message */}
                <div className="mt-12 text-center">
                    {analysisStatus === "failed" && (
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            <AlertCircle className="w-5 h-5" />
                            <span className="font-medium">Analysis failed. Please try again.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
