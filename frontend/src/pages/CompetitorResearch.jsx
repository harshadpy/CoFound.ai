import React, { useState } from 'react';
import { Search, ChevronRight, Loader2, GitCompare, ShieldAlert, Sparkles, ExternalLink, Bookmark, BookmarkCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';

export default function CompetitorResearch() {
    const { toolResults, setToolResult, saveInsight } = useStore();
    const cached = toolResults['competitors'];

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
            const res = await fetch('/api/tools/competitors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, sector })
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setResult(data);
            setToolResult('competitors', query, data);
        } catch (err) {
            setError(err.message || 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        const ok = saveInsight({
            id: Date.now().toString(),
            type: 'competitors',
            title: `Competitors: ${query}`,
            query,
            data: result,
            savedAt: Date.now()
        });
        if (ok) setSaved(true);
    };

    const saturationColor = (score) => {
        if (score >= 8) return 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400';
        if (score >= 5) return 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400';
        return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400';
    };

    return (
        <div className="max-w-7xl mx-auto px-8 pt-8 pb-20">

            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                    <span>Analysis Tools</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Competitor Research</span>
                </div>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Competitor Analysis</h1>
                        <p className="text-slate-500 dark:text-slate-400">AI-powered competitive landscape analysis with real web research.</p>
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
                            placeholder="e.g. AI recruiting platform, subscription skincare brand, B2B invoicing SaaS..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" />
                    </div>
                    <div className="w-full md:w-48">
                        <input type="text" value={sector} onChange={e => setSector(e.target.value)}
                            placeholder="Sector (optional)"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" />
                    </div>
                    <button type="submit" disabled={loading || !query.trim()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Researching...</> : <><GitCompare className="w-4 h-4" /> Analyze Competitors</>}
                    </button>
                </div>
            </form>

            {loading && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">AI is mapping the competitive landscape...</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Searching YC, Product Hunt, startup databases and the web</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl p-5 mb-8">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {result && !loading && (
                <div className="space-y-8">
                    <div className="flex items-center gap-6 bg-white dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 p-5 shadow-sm">
                        <div className="text-center px-6 py-3 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-600">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Saturation Score</div>
                            <div className={cn("text-3xl font-black px-3 py-1 rounded-lg", saturationColor(result.saturation_score))}>
                                {result.saturation_score}/10
                            </div>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{result.market_insights}</p>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-red-500" /> Direct Competitors
                        </h2>
                        <div className="space-y-4">
                            {(result.direct_competitors || []).map((comp, i) => (
                                <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 p-5 shadow-sm">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-700 dark:text-blue-300 font-black text-lg">
                                                {comp.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{comp.name}</h3>
                                                    {comp.website && <a href={comp.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700"><ExternalLink className="w-3.5 h-3.5" /></a>}
                                                </div>
                                                <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    {comp.funding && <span className="bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-medium">{comp.funding}</span>}
                                                    {comp.team_size && <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{comp.team_size}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{comp.description}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {comp.strengths?.length > 0 && (
                                            <div className="bg-emerald-50 dark:bg-emerald-950 rounded-lg p-3">
                                                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">Strengths</div>
                                                <ul className="space-y-1">{comp.strengths.map((s, j) => <li key={j} className="text-xs text-emerald-800 dark:text-emerald-300">• {s}</li>)}</ul>
                                            </div>
                                        )}
                                        {comp.weaknesses?.length > 0 && (
                                            <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3">
                                                <div className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-2">Weaknesses / Gaps</div>
                                                <ul className="space-y-1">{comp.weaknesses.map((w, j) => <li key={j} className="text-xs text-red-800 dark:text-red-300">• {w}</li>)}</ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {(result.indirect_competitors || []).length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-500" /> Indirect / Alternative Solutions
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(result.indirect_competitors || []).map((comp, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 p-4 shadow-sm border-l-4 border-l-amber-400">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold text-sm">{comp.name?.charAt(0) || '?'}</div>
                                            <h3 className="font-bold text-slate-900 dark:text-slate-100">{comp.name}</h3>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">{comp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!result && !loading && !error && (
                <div className="flex flex-col items-center justify-center py-24 text-center opacity-60">
                    <GitCompare className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-lg font-semibold text-slate-500 dark:text-slate-400">Describe your idea to map the competitive landscape</p>
                </div>
            )}
        </div>
    );
}
