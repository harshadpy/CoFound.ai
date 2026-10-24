import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    Loader2, 
    CheckCircle2, 
    Circle, 
    AlertCircle, 
    Lightbulb, 
    Users, 
    TrendingUp, 
    Target, 
    Wrench, 
    AlertTriangle, 
    Search as SearchIcon, 
    Zap, 
    FileCheck,
    SlidersHorizontal,
    ArrowRight,
    Send,
    Sparkles,
    ShieldAlert
} from 'lucide-react';
import { cn } from '../lib/utils';
import { apiUrl } from '../lib/api';
import { ErrorBanner } from '../components/ui';

export default function ActiveAnalysis() {
    const { id: routeAnalysisId } = useParams();
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
        hitlReviewData,
        resumeAnalysis
    } = useStore();
    const navigate = useNavigate();
    const bottomRef = useRef(null);
    const [retrying, setRetrying] = useState(false);
    
    // HITL local steering state
    const [additionalComps, setAdditionalComps] = useState('');
    const [founderNotes, setFounderNotes] = useState('');
    const [submittingResume, setSubmittingResume] = useState(false);

    const effectiveAnalysisId = routeAnalysisId || currentAnalysisId;

    useEffect(() => {
        if (routeAnalysisId && routeAnalysisId !== currentAnalysisId) {
            useStore.setState({ currentAnalysisId: routeAnalysisId });
        }
    }, [routeAnalysisId, currentAnalysisId]);

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
        if (!effectiveAnalysisId) {
            navigate('/');
            return;
        }

        let eventSource = null;
        let fallbackInterval = null;
        let isClosed = false;

        const handleCompleted = async () => {
            if (isClosed) return;
            isClosed = true;
            if (eventSource) {
                eventSource.close();
                eventSource = null;
            }
            if (fallbackInterval) {
                clearInterval(fallbackInterval);
                fallbackInterval = null;
            }

            // Retry fetching report up to 3 times to allow final backend DB commit
            let rep = null;
            for (let i = 0; i < 3; i++) {
                rep = await fetchAndSaveReport(effectiveAnalysisId);
                if (rep) break;
                await new Promise(res => setTimeout(res, 800));
            }
            if (rep) {
                navigate('/report');
            }
        };

        // Immediate snapshot fetch on mount
        pollStatus(effectiveAnalysisId).then((status) => {
            if (status === 'completed') {
                handleCompleted();
            }
        });

        // Try Server-Sent Events for zero-latency live telemetry
        try {
            eventSource = new EventSource(apiUrl(`/api/analysis/${effectiveAnalysisId}/stream`));

            eventSource.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    applyStreamUpdate(data);

                    // ONLY finish when the OVERALL analysis completes
                    if (data.type === 'completed' || (data.type !== 'agent_progress' && data.status === 'completed')) {
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
                        const status = await pollStatus(effectiveAnalysisId);
                        if (status === "completed") {
                            handleCompleted();
                        } else if (status === "failed") {
                            clearInterval(fallbackInterval);
                        }
                    }, 2000);
                }
            };
        } catch (e) {
            fallbackInterval = setInterval(async () => {
                const status = await pollStatus(effectiveAnalysisId);
                if (status === "completed") {
                    handleCompleted();
                } else if (status === "failed") {
                    clearInterval(fallbackInterval);
                }
            }, 2000);
        }

        // In addition to SSE, maintain a periodic heartbeat poll every 2.5s to guarantee progress updates even during idle/resume
        const heartbeatInterval = setInterval(async () => {
            if (isClosed) return;
            const status = await pollStatus(effectiveAnalysisId);
            if (status === "completed") {
                handleCompleted();
            }
        }, 2500);

        return () => {
            isClosed = true;
            if (eventSource) eventSource.close();
            if (fallbackInterval) clearInterval(fallbackInterval);
            clearInterval(heartbeatInterval);
        };
    }, [effectiveAnalysisId, navigate, pollStatus, applyStreamUpdate, fetchAndSaveReport]);

    const handleRetry = async () => {
        if (!analysisInput?.trim()) { navigate('/'); return; }
        setRetrying(true);
        try {
            await startAnalysis(contextTags || {});
        } finally {
            setRetrying(false);
        }
    };

    const handleResume = async () => {
        if (!effectiveAnalysisId) return;
        setSubmittingResume(true);
        try {
            const compList = additionalComps
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);

            await resumeAnalysis(effectiveAnalysisId, {
                additional_competitors: compList,
                founder_notes: founderNotes.trim() || undefined
            });
            // Immediately trigger status poll to synchronize resumed agent statuses
            await pollStatus(effectiveAnalysisId);
        } catch (err) {
            alert("Failed to resume analysis: " + err.message);
        } finally {
            setSubmittingResume(false);
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

    const isAwaitingReview = analysisStatus === 'awaiting_review';

    return (
        <div className="min-h-screen bg-background py-12 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/50 dark:bg-blue-950/50 border border-blue-100/50 dark:border-blue-900 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm backdrop-blur-sm">
                        <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                            <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", isAwaitingReview ? "bg-amber-400 animate-pulse" : "bg-blue-400 pulse-dot")} />
                            <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", isAwaitingReview ? "bg-amber-500" : "bg-blue-500")} />
                        </span>
                        {isAwaitingReview ? "Human-In-The-Loop Steering Active" : "Agent Swarm Active"}
                    </div>
                    <h2 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-3">
                        {isAwaitingReview ? "Review Market Findings & Steer Graph" : "Generating Intelligence Report"}
                    </h2>
                    <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        {isAwaitingReview 
                            ? "LangGraph checkpoint paused before Synthesis and Adversarial Critic. Inspect discoveries and steer the model."
                            : "Orchestrating 11 agentic AI workers with persistent SQLite state checkpoints."
                        }
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-6 max-w-md mx-auto">
                        <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                            <span>Pipeline Progress</span>
                            <span>{progressPercentage}%</span>
                        </div>
                        <div className="h-2.5 bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden border border-slate-100 dark:border-slate-700/50">
                            <div
                                className={cn(
                                    "h-full transition-all duration-500 ease-out",
                                    isAwaitingReview ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"
                                )}
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Human-In-The-Loop Steering Card ── */}
                {isAwaitingReview && (
                    <div className="mb-10 bg-amber-50/70 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700/60 rounded-2xl p-6 sm:p-8 shadow-xl shadow-amber-500/5 backdrop-blur-md animate-fade-in">
                        <div className="flex items-start gap-3.5 mb-6">
                            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 rounded-xl text-amber-700 dark:text-amber-300">
                                <SlidersHorizontal className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    Strategic Steering Checkpoint
                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 uppercase tracking-wide">
                                        Paused Before Synthesis
                                    </span>
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                                    Our parallel research swarm finished analyzing competitors, signals, and feasibility. You can adjust the direction or inject rivals before the <strong>Adversarial VC Critic</strong> stress-tests this hypothesis.
                                </p>
                            </div>
                        </div>

                        {/* Market Discoveries Snapshot */}
                        {hitlReviewData && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6">
                                <div className="bg-white/80 dark:bg-slate-900/70 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/40">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Discovered Competitors</div>
                                    <div className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                                        {Array.isArray(hitlReviewData.competitors) && hitlReviewData.competitors.length > 0
                                            ? hitlReviewData.competitors.map(c => typeof c === 'object' ? c.name : c).slice(0, 4).join(', ')
                                            : "Analyzing sector landscape..."}
                                    </div>
                                </div>
                                <div className="bg-white/80 dark:bg-slate-900/70 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/40">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Validation Verdict</div>
                                    <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                        {hitlReviewData.validation_verdict || "Strong market indicators observed"}
                                    </div>
                                </div>
                                <div className="bg-white/80 dark:bg-slate-900/70 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/40">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Market Growth / CAGR</div>
                                    <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                        {hitlReviewData.market_growth_cagr || "High-growth segment"}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Interactive Form Controls */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Add Unlisted Direct Rivals or Incumbents (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={additionalComps}
                                    onChange={(e) => setAdditionalComps(e.target.value)}
                                    placeholder="e.g. Acme Inc, RivalSoft, Internal Enterprise Excel"
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Strategic Notes & Positioning Directives for the Critic (Optional)
                                </label>
                                <textarea
                                    value={founderNotes}
                                    onChange={(e) => setFounderNotes(e.target.value)}
                                    rows={2}
                                    placeholder="e.g. We only target enterprise banks with on-prem compliance, so consumer SaaS competitors are not relevant."
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleResume}
                                    disabled={submittingResume}
                                    className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                                >
                                    {submittingResume ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Resuming Pipeline Checkpoint...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Submit Guidance & Resume Pipeline
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
