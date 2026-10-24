import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
    History, Search, Trash2, ArrowRight, RotateCcw, 
    CheckCircle2, AlertTriangle, XCircle, Clock, Sparkles, 
    ChevronRight, Filter, AlertCircle 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { apiUrl } from '../lib/api';
import { EmptyState, Button, useToast } from '../components/ui';

export default function AnalysisHistory() {
    const navigate = useNavigate();
    const { user, openAuthModal, setAnalysisInput, fetchAndSaveReport } = useStore();
    const [analyses, setAnalyses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('ALL');
    const [deletingId, setDeletingId] = useState(null);

    const loadAnalyses = async () => {
        try {
            setLoading(true);
            const userId = user?.id || 'default_user';
            const res = await fetch(apiUrl(`/api/analyses?user_id=${encodeURIComponent(userId)}`));
            if (res.ok) {
                const data = await res.json();
                setAnalyses(data || []);
            }
        } catch (err) {
            console.error('Failed to load past analyses:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnalyses();
    }, [user?.id]);

    const toast = useToast();

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this analysis report?")) return;
        
        try {
            setDeletingId(id);
            const userId = user?.id || 'default_user';
            const res = await fetch(apiUrl(`/api/analyses/${id}?user_id=${encodeURIComponent(userId)}`), { method: 'DELETE' });
            if (res.ok) {
                setAnalyses(prev => prev.filter(a => a.id !== id));
                toast('Analysis deleted successfully', 'info');
            } else {
                toast('Failed to delete analysis', 'error');
            }
        } catch (err) {
            console.error('Failed to delete analysis:', err);
            toast('Error deleting analysis', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const handleOpenReport = async (analysis) => {
        if (analysis.status === 'completed') {
            await fetchAndSaveReport(analysis.id);
            navigate('/report');
        } else if (analysis.status === 'running' || analysis.status === 'pending') {
            useStore.setState({ currentAnalysisId: analysis.id });
            navigate('/analysis/' + analysis.id);
        }
    };

    const handleIterate = (e, analysis) => {
        e.stopPropagation();
        setAnalysisInput(analysis.raw_text);
        navigate('/');
    };

    const filteredAnalyses = analyses.filter(item => {
        const text = (item.raw_text || '').toLowerCase();
        const matchesQuery = text.includes(searchQuery.toLowerCase());
        
        const verdict = item.result?.decision_results?.decision || '';
        const matchesFilter = 
            selectedFilter === 'ALL' || 
            (selectedFilter === 'GO' && verdict.toUpperCase() === 'GO') ||
            (selectedFilter === 'PIVOT' && verdict.toUpperCase() === 'PIVOT') ||
            (selectedFilter === 'KILL' && (verdict.toUpperCase() === 'KILL' || verdict.toUpperCase() === 'AVOID'));

        return matchesQuery && matchesFilter;
    });

    const getVerdictBadge = (verdict, score) => {
        if (!verdict) return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-500">In Progress</span>;
        
        const v = verdict.toUpperCase();
        if (v === 'GO') {
            return (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>GO</span>
                    {score && <span className="opacity-80">({score}%)</span>}
                </div>
            );
        }
        if (v === 'PIVOT') {
            return (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>PIVOT</span>
                    {score && <span className="opacity-80">({score}%)</span>}
                </div>
            );
        }
        return (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold">
                <XCircle className="w-3.5 h-3.5" />
                <span>KILL</span>
                {score && <span className="opacity-80">({score}%)</span>}
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto py-10 px-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">
                        <History className="w-3.5 h-3.5" />
                        Intelligence Archive
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                        Past Analyses
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Review, compare, and reopen previous market validation runs saved in your local database.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/')}
                    aria-label="Start new analysis"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    New Analysis
                </button>
            </div>

            {/* Guest Session vs Permanent Account Banner */}
            {user?.is_guest ? (
                <div className="mb-6 p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-start sm:items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 mt-1 sm:mt-0 animate-pulse" />
                        <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                Guest Session History
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Analyses created during this session are clean and individual. Sign in to permanently save your analyses to your account.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={openAuthModal}
                        className="self-start sm:self-auto shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                        <span>Save Analyses & Sign In</span>
                    </button>
                </div>
            ) : (
                <div className="mb-6 p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-900/30 flex items-center gap-2.5 text-xs text-emerald-400 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span><strong>Cloud Account Active:</strong> All past analyses are securely stored and synced to your founder account.</span>
                </div>
            )}

            {/* Search & Filter Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search past hypotheses by keyword..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                    {['ALL', 'GO', 'PIVOT', 'KILL'].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setSelectedFilter(filter)}
                            aria-pressed={selectedFilter === filter}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                                selectedFilter === filter
                                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                            )}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content List */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-3" />
                    <p className="text-sm text-slate-500">Loading intelligence history...</p>
                </div>
            ) : filteredAnalyses.length === 0 ? (
                <EmptyState
                    icon={searchQuery ? Search : History}
                    title={searchQuery ? "No matching analyses found" : "No analyses yet"}
                    description={searchQuery ? "Try different keywords or clear the filter." : "Your completed analyses will appear here. Launch your first one now!"}
                    action={
                        <Button onClick={() => navigate('/')}>
                            <Sparkles className="w-4 h-4 mr-1.5" aria-hidden="true" />
                            Start First Analysis
                        </Button>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredAnalyses.map((item) => {
                        const decision = item.result?.decision_results || {};
                        const dateFormatted = item.created_at 
                            ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'Recently';
                        const sector = item.context_tags?.industry?.[0] || item.context_tags?.sector || 'General';

                        return (
                            <div
                                key={item.id}
                                onClick={() => handleOpenReport(item)}
                                className="group relative bg-card border border-border hover:border-primary/30 p-5 rounded-2xl shadow-sm hover:shadow-md transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        {getVerdictBadge(decision.decision, decision.confidence_score)}
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                            {sector}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-slate-400">
                                            <Clock className="w-3 h-3" />
                                            {dateFormatted}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 self-end sm:self-auto opacity-80 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleIterate(e, item)}
                                            aria-label="Reuse as new analysis"
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                                        >
                                            <RotateCcw className="w-4 h-4" aria-hidden="true" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, item.id)}
                                            disabled={deletingId === item.id}
                                            aria-label="Delete analysis"
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                                        >
                                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2">
                                    {item.raw_text}
                                </p>

                                {decision.reasoning && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                                        {decision.reasoning}
                                    </p>
                                )}

                                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                                    <span className="text-slate-400">ID: {item.id.slice(0, 8)}...</span>
                                    <span className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                                        View Full Report <ArrowRight className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
