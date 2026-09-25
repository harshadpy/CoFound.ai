import React, { useState } from 'react';
import { Search, ChevronRight, Loader2, Target, AlertTriangle, CheckCircle2, User, Bookmark, BookmarkCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';

export default function MarketGaps() {
    const { toolResults, setToolResult, saveInsight } = useStore();
    const cached = toolResults['market-gaps'];

    const [query, setQuery] = useState(cached?.query || '');
    const [segment, setSegment] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(cached?.result || null);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);

    const handleAnalyze = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        setError(null);
        setSaved(false);
        try {
            const res = await fetch('/api/tools/market-gaps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, segment, problem: query })
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setResult(data);
            setToolResult('market-gaps', query, data);
        } catch (err) {
            setError(err.message || 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        const ok = saveInsight({
            id: Date.now().toString(),
            type: 'market-gaps',
            title: `Market Gaps: ${query}`,
            query,
            data: result,
            savedAt: Date.now()
        });
        if (ok) setSaved(true);
    };

    const verdictStyle = (verdict) => {
        if (!verdict) return 'bg-slate-600';
        const v = verdict.toLowerCase();
        if (v.includes('strong')) return 'bg-emerald-600';
        if (v.includes('moderate')) return 'bg-amber-500';
        return 'bg-red-600';
    };

    const sentimentColor = (s) => {
        if (s === 'positive') return 'text-emerald-600 dark:text-emerald-400';
        if (s === 'negative') return 'text-red-600 dark:text-red-400';
        return 'text-amber-600 dark:text-amber-400';
    };

    const wtpColor = (wtp) => {
        if (wtp === 'High') return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300';
        if (wtp === 'Medium') return 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300';
        return 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300';
    };

    return (
        <div className="max-w-7xl mx-auto px-8 pt-8 pb-20">

            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                    <span>Analysis Tools</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Market Gaps</span>
                </div>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Market Gap Matrix</h1>
                        <p className="text-slate-500 dark:text-slate-400">AI-simulated demand research: pain points, willingness to pay, and adoption barriers.</p>
                    </div>
                    {result && (
                        <button onClick={handleSave} disabled={saved}
                            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors",
                                saved ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 cursor-default"
                                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-border dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-700 hover:border-emerald-200"
                            )}>
                            {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                            {saved ? 'Saved!' : 'Save to Insights'}
                        </button>
                    )}
                </div>
            </div>

            <form onSubmit={handleAnalyze} className="bg-white dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 p-6 shadow-sm mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                            placeholder="Describe a problem or market, e.g. rural doctors need better patient scheduling tools..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" />
                    </div>
                    <div className="w-full md:w-48">
                        <input type="text" value={segment} onChange={e => setSegment(e.target.value)}
                            placeholder="Segment (optional)"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" />
                    </div>
                    <button type="submit" disabled={loading || !query.trim()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Researching...</> : <><Target className="w-4 h-4" /> Analyze Market</>}
                    </button>
                </div>
            </form>

            {loading && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">AI is simulating market demand research...</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Modeling user segments, pain severity, and willingness to pay</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl p-5 mb-8">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {result && !loading && (
                <div className="space-y-8">
                    <div className={cn("rounded-xl p-5 text-white shadow-lg flex items-center gap-4", verdictStyle(result.overall_verdict))}>
                        <CheckCircle2 className="w-8 h-8 shrink-0" />
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-0.5">Overall Verdict</div>
                            <div className="text-2xl font-black">{result.overall_verdict}</div>
                            {result.data_source && <div className="text-xs opacity-70 mt-1">⚠️ {result.data_source}</div>}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" /> User Research Simulations
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {(result.validation_points || []).map((pt, i) => (
                                <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 p-5 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{pt.user_segment}</span>
                                        <span className={cn("text-xs font-bold px-2 py-1 rounded-full", wtpColor(pt.willingness_to_pay))}>WTP: {pt.willingness_to_pay}</span>
                                    </div>
                                    <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{pt.pain_point}</p>
                                    <blockquote className="text-sm text-slate-600 dark:text-slate-400 italic border-l-2 border-slate-200 dark:border-slate-600 pl-3 mb-3">"{pt.quote}"</blockquote>
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500 dark:text-slate-400">Pain:</span>
                                            <div className="flex gap-0.5">
                                                {Array.from({ length: 10 }).map((_, j) => (
                                                    <div key={j} className={cn("w-2 h-2 rounded-full", j < pt.severity ? "bg-red-500" : "bg-slate-200 dark:bg-slate-600")} />
                                                ))}
                                            </div>
                                            <span className="font-bold text-slate-700 dark:text-slate-300">{pt.severity}/10</span>
                                        </div>
                                        <span className={cn("font-bold capitalize", sentimentColor(pt.sentiment))}>{pt.sentiment}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {(result.adoption_barriers || []).length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 p-5 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" /> Adoption Barriers
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {result.adoption_barriers.map((barrier, i) => (
                                    <div key={i} className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950 rounded-lg p-3">
                                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-sm text-amber-800 dark:text-amber-300">{barrier}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!result && !loading && !error && (
                <div className="flex flex-col items-center justify-center py-24 text-center opacity-60">
                    <Target className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-lg font-semibold text-slate-500 dark:text-slate-400">Describe a market problem to discover gaps and demand</p>
                </div>
            )}
        </div>
    );
}
