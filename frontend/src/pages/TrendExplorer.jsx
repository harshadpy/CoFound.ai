import React, { useState } from 'react';
import { Search, TrendingUp, ArrowUpRight, Loader2, Sparkles, BarChart2, Bookmark, BookmarkCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';

export default function TrendExplorer() {
    const { toolResults, setToolResult, saveInsight } = useStore();
    const cached = toolResults['trends'];

    const [query, setQuery] = useState(cached?.query || '');
    const [sector, setSector] = useState('');
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
            const res = await fetch('/api/tools/trends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, sector })
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setResult(data);
            setToolResult('trends', query, data);
        } catch (err) {
            setError(err.message || 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        const ok = saveInsight({
            id: Date.now().toString(),
            type: 'trends',
            title: `Trends: ${query}`,
            query,
            data: result,
            savedAt: Date.now()
        });
        if (ok) setSaved(true);
    };

    return (
        <div className="max-w-7xl mx-auto px-8 pt-8 pb-20">

            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Trend Explorer</h1>
                        <p className="text-slate-500 dark:text-slate-400">Discover real-time market shifts and growth signals using AI research.</p>
                    </div>
                    {result && (
                        <button
                            onClick={handleSave}
                            disabled={saved}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors",
                                saved
                                    ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 cursor-default"
                                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-border dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-200"
                            )}
                        >
                            {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                            {saved ? 'Saved!' : 'Save to Insights'}
                        </button>
                    )}
                </div>
            </div>

            {/* Query Form */}
            <form onSubmit={handleAnalyze} className="bg-white dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 p-6 shadow-sm mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="e.g. AI-powered healthcare diagnostics, ghost kitchen software..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <input
                            type="text"
                            value={sector}
                            onChange={e => setSector(e.target.value)}
                            placeholder="Sector (e.g. Fintech)"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Researching...</> : <><TrendingUp className="w-4 h-4" /> Explore Trends</>}
                    </button>
                </div>
            </form>

            {loading && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">AI is researching market trends...</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Searching the web, analyzing signals, estimating market size</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl p-5 mb-8">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {result && !loading && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl p-5 shadow-lg">
                            <div className="text-xs font-bold uppercase tracking-wider opacity-75 mb-1">Market Size</div>
                            <div className="text-2xl font-black">{result.market_size_estimate || 'N/A'}</div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-xl p-5 shadow-lg">
                            <div className="text-xs font-bold uppercase tracking-wider opacity-75 mb-1">CAGR</div>
                            <div className="text-2xl font-black">{result.market_growth_cagr || 'N/A'}</div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-border dark:border-slate-700 shadow-sm">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Key Growth Drivers</div>
                            <ul className="space-y-1.5">
                                {(result.key_drivers || []).slice(0, 3).map((d, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                        <ArrowUpRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{d}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" /> Macro Trends
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {(result.macro_trends || []).map((trend, i) => (
                                <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 p-5 shadow-sm">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{trend.trend}</h3>
                                        <span className="shrink-0 text-xs font-bold px-2 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full ml-3">{trend.relevance_score}/10</span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">{trend.description}</p>
                                    <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md">{trend.timeframe}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {(result.micro_trends || []).length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-600" /> Micro Trends & Emerging Signals
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {(result.micro_trends || []).map((trend, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 p-5 shadow-sm border-l-4 border-l-purple-500">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-bold text-slate-900 dark:text-slate-100">{trend.trend}</h3>
                                            <span className="shrink-0 text-xs font-bold px-2 py-1 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-full ml-3">{trend.relevance_score}/10</span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-2">{trend.description}</p>
                                        <p className="text-xs text-slate-500 italic"><strong>Impact:</strong> {trend.impact}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!result && !loading && !error && (
                <div className="flex flex-col items-center justify-center py-24 text-center opacity-60">
                    <BarChart2 className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-lg font-semibold text-slate-500 dark:text-slate-400">Enter a topic or idea above to explore trends</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">AI will research market signals, CAGR, and emerging patterns</p>
                </div>
            )}
        </div>
    );
}
