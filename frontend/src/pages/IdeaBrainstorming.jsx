import React, { useState } from 'react';
import { Search, ChevronRight, Loader2, Lightbulb, ArrowRight, Shuffle, Bookmark, BookmarkCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';

export default function IdeaBrainstorming() {
    const { toolResults, setToolResult, saveInsight } = useStore();
    const cached = toolResults['brainstorm'];

    const [query, setQuery] = useState(cached?.query || '');
    const [problem, setProblem] = useState('');
    const [audience, setAudience] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(cached?.result || null);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        setError(null);
        setSaved(false);
        try {
            const res = await fetch('/api/tools/brainstorm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, problem: problem || query, audience })
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setResult(data);
            setToolResult('brainstorm', query, data);
        } catch (err) {
            setError(err.message || 'Generation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        const ok = saveInsight({
            id: Date.now().toString(),
            type: 'brainstorm',
            title: `Ideas: ${query}`,
            query,
            data: result,
            savedAt: Date.now()
        });
        if (ok) setSaved(true);
    };

    const ideaColors = [
        'border-l-blue-500',
        'border-l-purple-500',
        'border-l-emerald-500',
        'border-l-amber-500',
        'border-l-pink-500',
    ];

    return (
        <div className="max-w-7xl mx-auto px-8 pt-8 pb-20">

            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                    <span>Analysis Tools</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Idea Brainstorming</span>
                </div>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Idea Brainstorming</h1>
                        <p className="text-slate-500 dark:text-slate-400">AI-powered idea expansion and pivot generation from your core concept.</p>
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

            <form onSubmit={handleGenerate} className="bg-white dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 p-6 shadow-sm mb-8">
                <div className="mb-4 relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                        placeholder="Your core idea, e.g. an app that helps college students find part-time jobs near campus..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input type="text" value={problem} onChange={e => setProblem(e.target.value)}
                        placeholder="Core problem being solved (optional)"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" />
                    <input type="text" value={audience} onChange={e => setAudience(e.target.value)}
                        placeholder="Target audience (optional)"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" />
                </div>
                <button type="submit" disabled={loading || !query.trim()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating ideas...</> : <><Lightbulb className="w-5 h-5" /> Generate AI Ideas</>}
                </button>
            </form>

            {loading && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">AI is brainstorming variations and pivots...</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Generating expanded ideas and strategic pivot options</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl p-5 mb-8">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {result && !loading && (
                <div className="space-y-8">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-yellow-500" /> Expanded Idea Variations
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {(result.expanded_ideas || []).map((idea, i) => (
                                <div key={i} className={cn(
                                    "bg-white dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 border-l-4 p-5 shadow-sm hover:shadow-md transition-shadow group",
                                    ideaColors[i % ideaColors.length]
                                )}>
                                    <div className="flex items-start gap-3">
                                        <div className="text-2xl font-black text-slate-200 dark:text-slate-700 leading-none mt-0.5">{String(i + 1).padStart(2, '0')}</div>
                                        <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed text-sm flex-1">{idea}</p>
                                    </div>
                                    <div className="flex justify-end mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 font-semibold hover:underline">
                                            Deep Analysis <ArrowRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {(result.pivot_options || []).length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                                <Shuffle className="w-5 h-5 text-purple-600" /> Strategic Pivot Options
                            </h2>
                            <div className="space-y-3">
                                {(result.pivot_options || []).map((pivot, i) => (
                                    <div key={i} className="flex items-start gap-4 bg-white dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 p-4 shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-700 dark:text-purple-300 font-black text-sm shrink-0">{i + 1}</div>
                                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm flex-1">{pivot}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!result && !loading && !error && (
                <div className="flex flex-col items-center justify-center py-24 text-center opacity-60">
                    <Lightbulb className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-lg font-semibold text-slate-500 dark:text-slate-400">Enter your startup idea to generate AI variations</p>
                </div>
            )}
        </div>
    );
}
