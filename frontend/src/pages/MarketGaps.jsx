import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Loader2, Target, AlertTriangle, CheckCircle2, User, Bookmark, BookmarkCheck, Copy, Check, ArrowRight, Sparkles, AlertCircle, Quote, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { EmptyState, ErrorBanner, Button, useToast } from '../components/ui';

const PRESETS = [
    { label: 'AI Medical Coding & TPA', query: 'Autonomous AI Medical Coding & TPA Insurance Pre-Auth', segment: 'Private Hospitals & TPAs' },
    { label: 'WhatsApp B2B Sales SDR', query: 'Autonomous WhatsApp B2B Sales SDR for Distributors', segment: 'Distributors & FMCG Brands' },
    { label: 'Cross-Border Trade OS', query: 'Single-Window Customs & FX Hedging OS for Exporters', segment: 'MSME Exporters' },
    { label: 'EV Battery Telematics', query: 'EV Battery Telematics & 2nd-Life Grid Energy Storage', segment: 'Commercial Fleet Operators' },
    { label: 'Dark Store Demand AI', query: 'Hyperlocal Demand Predictor for Quick Commerce Dark Stores', segment: 'Quick Commerce Dark Stores' },
];

export default function MarketGaps() {
    const { toolResults, setToolResult, saveInsight, setAnalysisInput, setContextTags } = useStore();
    const navigate = useNavigate();
    const toast = useToast();
    const cached = toolResults['market-gaps'];

    const [query, setQuery] = useState(cached?.query || '');
    const [segment, setSegment] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(cached?.result || null);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);
    const [filterTab, setFilterTab] = useState('all'); // 'all' | 'high_pain' | 'high_wtp'

    const executeAnalysis = async (targetQuery, targetSegment) => {
        const q = (targetQuery || query).trim();
        const s = (targetSegment !== undefined ? targetSegment : segment).trim();
        if (!q) return;

        setLoading(true);
        setError(null);
        setSaved(false);
        setCopied(false);

        try {
            const res = await fetch('/api/tools/market-gaps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: q, segment: s, problem: q })
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setResult(data);
            setToolResult('market-gaps', q, data);
        } catch (err) {
            setError(err.message || 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = (e) => {
        e.preventDefault();
        executeAnalysis();
    };

    const handleApplyPreset = (preset) => {
        setQuery(preset.query);
        setSegment(preset.segment);
        executeAnalysis(preset.query, preset.segment);
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
        if (ok) {
            setSaved(true);
            toast('Market gaps analysis saved to insights', 'success');
        }
    };

    const handleCopyMarkdown = async () => {
        if (!result) return;
        let md = `# Market Gaps & Validation: ${query}\n`;
        if (segment) md += `**Target Segment:** ${segment}\n\n`;
        if (result.overall_verdict) md += `- **Demand Verdict:** ${result.overall_verdict}\n\n`;
        
        if (result.validation_points?.length) {
            md += `### User Pain Signals\n`;
            result.validation_points.forEach(pt => {
                md += `#### ${pt.user_segment} (Pain: ${pt.severity}/10, WTP: ${pt.willingness_to_pay || 'N/A'})\n`;
                md += `- **Pain Point:** ${pt.pain_point}\n`;
                if (pt.sentiment) md += `- **Sentiment:** ${pt.sentiment}\n`;
                md += `\n`;
            });
        }
        if (result.adoption_barriers?.length) {
            md += `### Adoption Barriers\n`;
            result.adoption_barriers.forEach(b => { md += `- ${b}\n`; });
        }
        await navigator.clipboard.writeText(md);
        setCopied(true);
        toast('Market gaps markdown copied to clipboard', 'success');
        setTimeout(() => setCopied(false), 2500);
    };

    const handleLaunchSwarm = () => {
        setAnalysisInput(query);
        setContextTags({
            industry: ['Technology'],
            geo: ['Global'],
            segment: segment ? [segment] : ['B2B Customers']
        });
        toast('Loaded hypothesis into Agentic Swarm', 'info');
        navigate('/');
    };

    const verdictStyle = (verdict) => {
        if (!verdict) return 'bg-muted text-foreground border-border';
        const v = verdict.toLowerCase();
        if (v.includes('strong') || v.includes('high')) return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
        if (v.includes('moderate') || v.includes('medium')) return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800';
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800';
    };

    return (
        <div className="max-w-7xl mx-auto px-8 pt-8 pb-20">

            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Market Gaps & Validation</h1>
                    <p className="text-slate-500 dark:text-slate-400">Surface unmet customer pain points, adoption friction, and willingness-to-pay signals.</p>
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
                            onClick={handleLaunchSwarm}
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
            <form onSubmit={handleAnalyze} className="bg-card rounded-xl border border-border p-6 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row gap-3 mb-4">
                    <div className="flex-1 relative">
                        <label htmlFor="gaps-query-input" className="sr-only">Market gap hypothesis</label>
                        <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                        <input
                            id="gaps-query-input"
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="e.g. Cross-border trade compliance friction, hospital TPA claim rejections..."
                            className="w-full pl-10 pr-4 py-2.5 bg-muted/60 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <div className="w-full md:w-56">
                        <label htmlFor="gaps-segment-input" className="sr-only">Target Segment</label>
                        <input
                            id="gaps-segment-input"
                            type="text"
                            value={segment}
                            onChange={e => setSegment(e.target.value)}
                            placeholder="Segment (e.g. MSME Exporters)"
                            className="w-full px-4 py-2.5 bg-muted/60 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={loading || !query.trim()}
                        isLoading={loading}
                        className="whitespace-nowrap flex items-center gap-2"
                    >
                        <Target className="w-4 h-4" aria-hidden="true" /> Detect Gaps
                    </Button>
                </div>

                {/* Curated Presets Bar */}
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border">
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
            </form>

            {/* Error Banner */}
            {error && (
                <div className="mb-8">
                    <ErrorBanner
                        message={error}
                        onRetry={executeAnalysis}
                    />
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 bg-primary/10 rounded-2xl animate-pulse text-primary">
                        <Target className="w-8 h-8 animate-bounce" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Mining Customer Pain Signals...</h3>
                    <p className="text-sm text-muted-foreground max-w-md text-center">
                        Searching forums, reviews, and industry complaints to quantify pain severity and willingness to pay...
                    </p>
                </div>
            )}

            {/* Empty State */}
            {!loading && !result && !error && (
                <EmptyState
                    icon={Target}
                    title="No market gap analysis active"
                    description="Enter a startup hypothesis or choose a preset to identify unmet customer needs, regulatory friction, and willingness-to-pay indicators."
                    action={
                        <Button variant="outline" size="sm" onClick={() => handleApplyPreset(PRESETS[2])}>
                            Try "{PRESETS[2].label}"
                        </Button>
                    }
                />
            )}

            {/* Results Display */}
            {!loading && result && (
                <div className="space-y-8 animate-fade-in-up">

                    {/* Overall Demand Verdict with Visual Signal Count */}
                    <div className="bg-card border border-border rounded-xl p-6 sm:p-7 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                            <div>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Market Demand Verdict</span>
                                <div className="flex items-baseline gap-3 mt-1.5 flex-wrap">
                                    <span className={cn("text-xl font-black px-3.5 py-1 rounded-lg border", verdictStyle(result.overall_verdict))}>
                                        {result.overall_verdict || 'Validated Demand'}
                                    </span>
                                    <p className="text-xs text-muted-foreground">
                                        Synthesized across verified customer discussions, forum complaints, and friction points.
                                    </p>
                                </div>
                            </div>
                            <div className="text-sm text-muted-foreground bg-muted/60 px-4 py-3 rounded-xl border border-border shrink-0 text-center sm:text-right">
                                <div className="text-2xl font-black text-foreground">{result.validation_points?.length || 0}</div>
                                <div className="text-[11px] font-semibold text-muted-foreground uppercase">Pain Signals</div>
                            </div>
                        </div>

                        {/* Market Signals Executive Summary if available */}
                        {result.market_signals_summary && (
                            <div className="mt-5 p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs sm:text-sm text-foreground/90 leading-relaxed flex items-start gap-3">
                                <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-primary block text-xs uppercase tracking-wider mb-1">Executive Market Signal Summary</span>
                                    <span>{result.market_signals_summary}</span>
                                </div>
                            </div>
                        )}

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-border flex-wrap">
                            <button
                                type="button"
                                onClick={() => setFilterTab('all')}
                                className={cn(
                                    "text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors",
                                    filterTab === 'all'
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                All Signals ({result.validation_points?.length || 0})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterTab('high_pain')}
                                className={cn(
                                    "text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5",
                                    filterTab === 'high_pain'
                                        ? "bg-rose-500 text-white"
                                        : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                Critical Pain (≥7/10) ({result.validation_points?.filter(p => (p.severity || 0) >= 7).length || 0})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterTab('high_wtp')}
                                className={cn(
                                    "text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5",
                                    filterTab === 'high_wtp'
                                        ? "bg-emerald-600 text-white"
                                        : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Confirmed WTP ({result.validation_points?.filter(p => p.willingness_to_pay && p.willingness_to_pay.toLowerCase() !== 'low').length || 0})
                            </button>
                        </div>
                    </div>

                    {/* Validation Points Grid */}
                    {result.validation_points?.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-foreground">Customer Pain Signals & Willingness to Pay</h2>
                                <span className="text-xs text-muted-foreground font-medium">Quantified User Friction</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {result.validation_points
                                    .filter(pt => {
                                        if (filterTab === 'high_pain') return (pt.severity || 0) >= 7;
                                        if (filterTab === 'high_wtp') return pt.willingness_to_pay && pt.willingness_to_pay.toLowerCase() !== 'low';
                                        return true;
                                    })
                                    .map((pt, idx) => (
                                        <div key={idx} className="bg-card rounded-xl border border-border p-6 shadow-sm hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between group">
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                            <User className="w-4 h-4" />
                                                        </div>
                                                        <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{pt.user_segment}</h3>
                                                    </div>
                                                    {pt.sentiment && (
                                                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider", 
                                                            pt.sentiment === 'positive' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                                                            pt.sentiment === 'negative' ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800' :
                                                             'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                                        )}>
                                                            {pt.sentiment}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-foreground/90 font-medium leading-relaxed mb-3">{pt.pain_point}</p>
                                                
                                                {/* Verbatim Voice-of-Customer Quote if present */}
                                                {pt.quote && (
                                                    <div className="bg-muted/40 rounded-lg p-3 my-3 border-l-2 border-primary/70 text-xs text-muted-foreground flex items-start gap-2 italic">
                                                        <Quote className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5 opacity-70" />
                                                        <span className="leading-relaxed">"{pt.quote}"</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Pain Severity Progress Bar & WTP */}
                                            <div className="pt-4 border-t border-border space-y-3">
                                                <div>
                                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                                        <span className="text-muted-foreground font-medium">Pain Severity</span>
                                                        <span className="font-extrabold text-foreground">{pt.severity || 5}/10</span>
                                                    </div>
                                                    <div className="w-full bg-muted/70 h-2 rounded-full overflow-hidden">
                                                        <div
                                                             className={cn(
                                                                "h-full rounded-full transition-all",
                                                                (pt.severity || 5) >= 8 ? "bg-rose-500" : (pt.severity || 5) >= 5 ? "bg-amber-500" : "bg-emerald-500"
                                                            )}
                                                            style={{ width: `${Math.min((pt.severity || 5) * 10, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between text-xs pt-1">
                                                    <span className="text-muted-foreground font-medium">Willingness to Pay (WTP):</span>
                                                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                                                        {pt.willingness_to_pay || 'Medium'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Adoption Barriers */}
                    {result.adoption_barriers?.length > 0 && (
                        <div className="bg-card rounded-xl p-6 sm:p-7 border border-border border-l-4 border-l-amber-500 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Key Adoption Friction & Barriers
                                </h3>
                                <span className="text-xs text-muted-foreground font-medium">{result.adoption_barriers.length} Risks Flagged</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {result.adoption_barriers.map((barrier, idx) => (
                                    <div key={idx} className="flex items-start gap-3 text-sm text-foreground bg-amber-50/30 dark:bg-slate-800/60 p-3.5 rounded-lg border border-amber-200/40 dark:border-slate-700">
                                        <span className="text-amber-600 font-bold text-base leading-none mt-0.5">•</span>
                                        <span className="leading-relaxed font-medium">{barrier}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bottom Bridge CTA banner */}
                    <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border border-primary/25 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                        <div className="max-w-xl">
                            <span className="text-[11px] font-black tracking-widest text-primary uppercase">Agentic Market Fit Architecture</span>
                            <h3 className="font-extrabold text-foreground text-lg sm:text-xl mt-1">Want to turn these customer pain signals into high-converting wedges?</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                                Deploy our 11-agent intelligence swarm to synthesize early wedge products, pricing strategies, and defensible customer acquisition engines.
                            </p>
                        </div>
                        <Button variant="primary" size="lg" onClick={handleLaunchSwarm} className="whitespace-nowrap shrink-0 flex items-center gap-2 shadow-md hover:shadow-lg transition-all">
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
