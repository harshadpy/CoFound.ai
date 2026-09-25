import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Loader2, Lightbulb, ArrowRight, Shuffle, Bookmark, BookmarkCheck, Copy, Check, Sparkles, Layers, ArrowUpRight, Target, Coins } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { EmptyState, ErrorBanner, Button, useToast } from '../components/ui';

const PRESETS = [
    { label: 'Campus Micro-Gigs', query: 'Hyperlocal student skill exchange and on-campus micro-gigs platform', problem: 'College students struggle to find flexible hourly income near campus', audience: 'University Students' },
    { label: 'AI Contract Redlining', query: 'Autonomous AI contract review and compliance redlining for procurement teams', problem: 'Slow vendor onboarding due to legal review bottlenecks', audience: 'Corporate Procurement Teams' },
    { label: 'Dark Store Demand AI', query: 'Hyperlocal predictive inventory for instant delivery dark stores', problem: 'Perishable spoilage and stockouts in quick commerce hubs', audience: 'Quick Commerce Operators' },
    { label: 'Cross-Border Freight OS', query: 'Single-window digital freight customs forwarding and currency hedging', problem: 'Excessive paperwork delays and FX slippage for MSME exporters', audience: 'SMB Exporters' },
];

export default function IdeaBrainstorming() {
    const { toolResults, setToolResult, saveInsight, setAnalysisInput, setContextTags } = useStore();
    const navigate = useNavigate();
    const toast = useToast();
    const cached = toolResults['brainstorm'];

    const [query, setQuery] = useState(cached?.query || '');
    const [problem, setProblem] = useState('');
    const [audience, setAudience] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(cached?.result || null);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);

    const executeGenerate = async (targetQuery, targetProblem, targetAudience) => {
        const q = (targetQuery || query).trim();
        const p = (targetProblem !== undefined ? targetProblem : problem).trim();
        const a = (targetAudience !== undefined ? targetAudience : audience).trim();
        if (!q) return;

        setLoading(true);
        setError(null);
        setSaved(false);
        setCopied(false);

        try {
            const res = await fetch('/api/tools/brainstorm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: q, problem: p || q, audience: a })
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setResult(data);
            setToolResult('brainstorm', q, data);
        } catch (err) {
            setError(err.message || 'Generation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = (e) => {
        e.preventDefault();
        executeGenerate();
    };

    const handleApplyPreset = (preset) => {
        setQuery(preset.query);
        setProblem(preset.problem);
        setAudience(preset.audience);
        executeGenerate(preset.query, preset.problem, preset.audience);
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
        if (ok) {
            setSaved(true);
            toast('Brainstormed ideas saved to insights', 'success');
        }
    };

    const handleCopyMarkdown = async () => {
        if (!result) return;
        let md = `# Brainstormed Startup Concepts: ${query}\n`;
        if (problem) md += `**Core Problem:** ${problem}\n`;
        if (audience) md += `**Target Audience:** ${audience}\n\n`;

        if (result.expanded_ideas?.length) {
            md += `### Expanded Startup Variations\n`;
            result.expanded_ideas.forEach((idea, idx) => {
                md += `${idx + 1}. ${idea}\n`;
            });
            md += `\n`;
        }
        if (result.pivot_options?.length) {
            md += `### Strategic Pivot Angles\n`;
            result.pivot_options.forEach((pivot, idx) => {
                md += `${idx + 1}. ${pivot}\n`;
            });
        }
        await navigator.clipboard.writeText(md);
        setCopied(true);
        toast('Ideas copied to clipboard as Markdown', 'success');
        setTimeout(() => setCopied(false), 2500);
    };

    const handleLaunchSwarmWithIdea = (specificIdea) => {
        setAnalysisInput(specificIdea || query);
        setContextTags({
            industry: ['Technology'],
            geo: ['Global'],
            segment: audience ? [audience] : ['Early Adopters']
        });
        toast('Loaded idea variation into Agentic Swarm', 'info');
        navigate('/');
    };

    return (
        <div className="max-w-7xl mx-auto px-8 pt-8 pb-20">

            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Idea Brainstorming & Pivots</h1>
                    <p className="text-slate-500 dark:text-slate-400">AI-driven concept expansion, adjacent niche exploration, and contrarian pivot architectures.</p>
                </div>
                {result && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyMarkdown}
                            className="flex items-center gap-1.5"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? 'Copied' : 'Copy Markdown'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSave}
                            disabled={saved}
                            className={cn("flex items-center gap-1.5", saved && "text-emerald-600 dark:text-emerald-400 border-emerald-300")}
                        >
                            {saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                            {saved ? 'Saved' : 'Save Insight'}
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleLaunchSwarmWithIdea(query)}
                            className="flex items-center gap-1.5 shadow-sm"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Launch Swarm Report
                            <ArrowRight className="w-3 h-3" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Query Form */}
            <form onSubmit={handleGenerate} className="bg-card rounded-xl border border-border p-6 shadow-sm mb-6">
                <div className="mb-4 relative">
                    <label htmlFor="brainstorm-query-input" className="sr-only">Core startup concept</label>
                    <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <input
                        id="brainstorm-query-input"
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Enter your seed idea (e.g. AI-powered clinical billing pre-authorization, campus gig network...)"
                        className="w-full pl-10 pr-4 py-2.5 bg-muted/60 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div>
                        <label htmlFor="brainstorm-problem-input" className="sr-only">Problem solved</label>
                        <input
                            id="brainstorm-problem-input"
                            type="text"
                            value={problem}
                            onChange={e => setProblem(e.target.value)}
                            placeholder="Core problem solved (optional)"
                            className="w-full px-4 py-2 bg-muted/60 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="brainstorm-audience-input" className="sr-only">Target audience</label>
                        <input
                            id="brainstorm-audience-input"
                            type="text"
                            value={audience}
                            onChange={e => setAudience(e.target.value)}
                            placeholder="Target audience / buyer persona (optional)"
                            className="w-full px-4 py-2 bg-muted/60 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-border">
                    {/* Presets */}
                    <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                        <span className="text-xs font-semibold text-muted-foreground shrink-0">Quick Presets:</span>
                        {PRESETS.map((p, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleApplyPreset(p)}
                                className="text-xs px-2.5 py-1 rounded-full bg-muted/80 text-foreground border border-border hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        disabled={loading || !query.trim()}
                        isLoading={loading}
                        className="whitespace-nowrap w-full sm:w-auto flex items-center justify-center gap-2"
                    >
                        <Lightbulb className="w-4 h-4" /> Generate Variations
                    </Button>
                </div>
            </form>

            {/* Error Banner */}
            {error && (
                <div className="mb-8">
                    <ErrorBanner
                        message={error}
                        onRetry={executeGenerate}
                    />
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 bg-primary/10 rounded-2xl animate-pulse text-primary">
                        <Lightbulb className="w-8 h-8 animate-bounce" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Synthesizing Concept Vectors...</h3>
                    <p className="text-sm text-muted-foreground max-w-md text-center">
                        Expanding target verticals, business model configurations, and strategic contingency pivots...
                    </p>
                </div>
            )}

            {/* Empty State */}
            {!loading && !result && !error && (
                <EmptyState
                    icon={Lightbulb}
                    title="No brainstormed concepts active"
                    description="Enter a seed idea above or pick one of our presets to generate adjacent wedge architectures and contrarian pivot options."
                    action={
                        <Button variant="outline" size="sm" onClick={() => handleApplyPreset(PRESETS[0])}>
                            Try "{PRESETS[0].label}"
                        </Button>
                    }
                />
            )}

            {/* Results Display */}
            {!loading && result && (
                <div className="space-y-8 animate-fade-in-up">

                    {/* Idea Variations */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-amber-500" /> Expanded Startup Variations & Wedges
                            </h2>
                            <span className="text-xs text-muted-foreground font-medium">Click "Analyze in Swarm" to run 11-agent report</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {((result.variations?.length ? result.variations : result.expanded_ideas) || []).map((item, i) => {
                                const isObj = typeof item === 'object' && item !== null;
                                const title = isObj ? item.title : `Variation ${i + 1}`;
                                const description = isObj ? item.description : item;
                                const wedge = isObj ? item.target_wedge : null;
                                const monetization = isObj ? item.monetization : null;
                                const fullIdeaText = isObj ? `${title}: ${description}` : item;

                                return (
                                    <div
                                        key={i}
                                        className="bg-card rounded-xl border border-border p-6 shadow-sm hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between group"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-2xl font-black text-primary/40 group-hover:text-primary transition-colors leading-none">
                                                        {String(i + 1).padStart(2, '0')}
                                                    </span>
                                                    <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors">
                                                        {title}
                                                    </h3>
                                                </div>
                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-muted text-muted-foreground uppercase">
                                                    Wedge
                                                </span>
                                            </div>
                                            <p className="text-foreground/90 text-sm font-medium leading-relaxed mb-4">
                                                {description}
                                            </p>

                                            {(wedge || monetization) && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3.5 border-t border-border/70 text-xs mb-4">
                                                    {wedge && (
                                                        <div className="bg-muted/40 p-2.5 rounded-lg border border-border/50">
                                                            <span className="flex items-center gap-1 font-bold text-primary text-[10px] uppercase tracking-wider mb-0.5">
                                                                <Target className="w-3 h-3" /> Initial Wedge
                                                            </span>
                                                            <span className="text-foreground/90 leading-snug">{wedge}</span>
                                                        </div>
                                                    )}
                                                    {monetization && (
                                                        <div className="bg-muted/40 p-2.5 rounded-lg border border-border/50">
                                                            <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-[10px] uppercase tracking-wider mb-0.5">
                                                                <Coins className="w-3 h-3" /> Monetization
                                                            </span>
                                                            <span className="text-foreground/90 leading-snug">{monetization}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-3 border-t border-border flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    await navigator.clipboard.writeText(fullIdeaText);
                                                    toast('Idea snippet copied', 'info');
                                                }}
                                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                                            >
                                                <Copy className="w-3 h-3" /> Copy Snippet
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleLaunchSwarmWithIdea(fullIdeaText)}
                                                className="text-xs font-semibold text-primary flex items-center gap-1.5 hover:underline"
                                            >
                                                <Sparkles className="w-3.5 h-3.5" /> Analyze in Swarm <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Pivot Angles */}
                    {(result.pivot_options || []).length > 0 && (
                        <div className="bg-card rounded-xl p-6 sm:p-7 border border-border border-l-4 border-l-violet-600 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <Shuffle className="w-5 h-5 text-violet-600" /> Strategic Pivot Options & Contingencies
                                </h2>
                                <span className="text-xs text-muted-foreground font-medium">{result.pivot_options.length} Contrarian Pivots</span>
                            </div>

                            <div className="space-y-3">
                                {result.pivot_options.map((pivot, i) => {
                                    const isObj = typeof pivot === 'object' && pivot !== null;
                                    const title = isObj ? pivot.title : `Pivot ${i + 1}`;
                                    const rationale = isObj ? pivot.rationale : pivot;
                                    const fullPivotText = isObj ? `${title}: ${rationale}` : pivot;

                                    return (
                                        <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 bg-muted/40 p-4 rounded-xl border border-border/60">
                                            <div className="flex items-start gap-3.5 flex-1">
                                                <div className="w-6 h-6 rounded-full bg-violet-600/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1">
                                                    {isObj && <h4 className="text-sm font-bold text-foreground mb-0.5">{title}</h4>}
                                                    <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">{rationale}</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleLaunchSwarmWithIdea(fullPivotText)}
                                                className="shrink-0 text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline flex items-center gap-1 self-end sm:self-center"
                                                title="Analyze this pivot as a startup"
                                            >
                                                Pivot Swarm <ArrowUpRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Bottom Bridge CTA banner */}
                    <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border border-primary/25 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                        <div className="max-w-xl">
                            <span className="text-[11px] font-black tracking-widest text-primary uppercase">Agentic Decision Swarm</span>
                            <h3 className="font-extrabold text-foreground text-lg sm:text-xl mt-1">Ready to validate these hypotheses with real market data?</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                                Choose any variation above or run the full seed concept through our 11-agent intelligence pipeline to evaluate unit economics, competitor moats, and Go / Pivot / Kill viability.
                            </p>
                        </div>
                        <Button variant="primary" size="lg" onClick={() => handleLaunchSwarmWithIdea(query)} className="whitespace-nowrap shrink-0 flex items-center gap-2 shadow-md hover:shadow-lg transition-all">
                            <Sparkles className="w-4 h-4" />
                            Launch Swarm Report
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>

                </div>
            )}

        </div>
    );
}
