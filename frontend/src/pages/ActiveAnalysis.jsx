import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, Circle, AlertCircle, Lightbulb, Users, TrendingUp, Target, Wrench, AlertTriangle, Search as SearchIcon, Zap, FileCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { ErrorBanner } from '../components/ui';

export default function ActiveAnalysis() {
    const { 
        currentAnalysisId, 
        analysisStatus, 
        pollStatus, 
        agentStatuses, 
        agentMetrics, 
        progressPercentage,
        applyStreamUpdate,
        fetchAndSaveReport,
        analysisInput,
        contextTags,
        startAnalysis,
    } = useStore();
    const navigate = useNavigate();
    const bottomRef = useRef(null);
    const [retrying, setRetrying] = useState(false);

    // Agent definitions with icons and descriptions
    const agents = [
        { id: 'structure', label: 'Thought Structuring', icon: Zap, desc: 'Analyzing core idea' },
        { id: 'ideation', label: 'Ideation', icon: Lightbulb, desc: 'Generating variations' },
        { id: 'similarity', label: 'Similarity Analysis', icon: SearchIcon, desc: 'Finding patterns' },
        { id: 'validation', label: 'Market Validation', icon: Users, desc: 'User feedback' },
        { id: 'feasibility', label: 'Feasibility', icon: Wrench, desc: 'Technical assessment' },
        { id: 'trend', label: 'Trend Intelligence', icon: TrendingUp, desc: 'Market trends' },
        { id: 'competitor', label: 'Competitor Analysis', icon: Target, desc: 'Researching rivals' },
        { id: 'synthesis', label: 'Synthesis', icon: FileCheck, desc: 'Combining insights' },
        { id: 'critic', label: 'Adversarial Critic', icon: AlertTriangle, desc: 'Stress-testing risks' },
        { id: 'decision', label: 'Decision Engine', icon: CheckCircle2, desc: 'Final verdict' },
        { id: 'report', label: 'Report Generation', icon: FileCheck, desc: 'Compiling report' }
    ];

    useEffect(() => {
        if (!currentAnalysisId) {
            navigate('/');
            return;
        }

        let eventSource = null;
        let fallbackInterval = null;
        let isClosed = false;

        const handleCompleted = async () => {
            if (isClosed) return;
            isClosed = true;
            if (eventSource) eventSource.close();
            if (fallbackInterval) clearInterval(fallbackInterval);
            await fetchAndSaveReport(currentAnalysisId);
            setTimeout(() => navigate('/report'), 600);
        };

        // Try Server-Sent Events for zero-latency live telemetry
        try {
            eventSource = new EventSource(`/api/analysis/${currentAnalysisId}/stream`);

            eventSource.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    applyStreamUpdate(data);

                    if (data.type === 'completed' || data.status === 'completed') {
                        handleCompleted();
                    }
                } catch (err) {
                    console.error("SSE parse error", err);
                }
            };

            eventSource.onerror = () => {
                // Fallback to polling if SSE disconnected
                if (eventSource) {
                    eventSource.close();
                    eventSource = null;
                }
                if (!fallbackInterval && !isClosed) {
                    fallbackInterval = setInterval(async () => {
                        const status = await pollStatus(currentAnalysisId);
                        if (status === "completed") {
                            handleCompleted();
                        } else if (status === "failed") {
                            clearInterval(fallbackInterval);
                        }
                    }, 2000);
                }
            };
        } catch (e) {
            // Immediate fallback if EventSource unavailable
            fallbackInterval = setInterval(async () => {
                const status = await pollStatus(currentAnalysisId);
                if (status === "completed") {
                    handleCompleted();
                } else if (status === "failed") {
                    clearInterval(fallbackInterval);
                }
            }, 2000);
        }

        return () => {
            isClosed = true;
            if (eventSource) eventSource.close();
            if (fallbackInterval) clearInterval(fallbackInterval);
        };
    }, [currentAnalysisId, navigate, pollStatus, applyStreamUpdate, fetchAndSaveReport]);

    const handleRetry = async () => {
        if (!analysisInput?.trim()) { navigate('/'); return; }
        setRetrying(true);
        try {
            await startAnalysis(contextTags || {});
        } finally {
            setRetrying(false);
        }
    };

    const getAgentStatus = (agentId) => {
        return agentStatuses[agentId] || 'pending';
    };

    const getStatusIcon = (status) => {
        if (status === 'completed') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
        if (status === 'running') return <Loader2 className="w-5 h-5 text-blue-500 dark:text-blue-400 animate-spin" />;
        return <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />;
    };

    return (
        <div className="min-h-screen bg-background py-12 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/50 dark:bg-blue-950/50 border border-blue-100/50 dark:border-blue-900 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm backdrop-blur-sm">
                        {/* animate-ping gated by prefers-reduced-motion in index.css .pulse-dot */}
                        <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                            <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-blue-400 dark:bg-blue-500 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500 dark:bg-blue-400" />
                        </span>
                        Agent Swarm Active
                    </div>
                    <h2 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-4">Generating Intelligence Report</h2>
                    <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Orchestrating <span className="font-semibold text-blue-600 dark:text-blue-400">11 agentic AI workers</span> to research, analyze, and validate your startup concept.
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-8 max-w-md mx-auto">
                        <div className="flex justify-between text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                            <span>Overall Progress</span>
                            <span>{progressPercentage}%</span>
                        </div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden border border-slate-100 dark:border-slate-700/50">
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
                                    isActive && "bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800 shadow-lg shadow-blue-100 dark:shadow-blue-900/30 ring-2 ring-blue-100 dark:ring-blue-900/50",
                                    isCompleted && "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40",
                                    !isActive && !isCompleted && "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60 dark:opacity-40"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "p-2 rounded-lg transition-colors border",
                                        isActive && "bg-blue-100 dark:bg-blue-950 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400",
                                        isCompleted && "bg-emerald-100 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400",
                                        !isActive && !isCompleted && "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                                    )}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className={cn(
                                                "font-semibold text-sm truncate",
                                                !isActive && !isCompleted ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-slate-100"
                                            )}>{agent.label}</h3>
                                            {getStatusIcon(status)}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{agent.desc}</p>
                                        {isActive && (
                                            <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                <span>Processing...</span>
                                            </div>
                                        )}
                                        {isCompleted && agentMetrics[agent.id] && (
                                            <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                                ✓ {agentMetrics[agent.id]}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Status Message / Error */}
                <div className="mt-12 text-center">
                    {analysisStatus === "failed" && (
                        <ErrorBanner
                            message="Analysis failed. Please check your API keys or try again."
                            onRetry={handleRetry}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
