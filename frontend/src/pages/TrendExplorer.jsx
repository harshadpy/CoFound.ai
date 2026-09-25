import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, ArrowUpRight, Loader2, Sparkles, BarChart2, Bookmark, BookmarkCheck, Copy, Check, ArrowRight, Award, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { EmptyState, ErrorBanner, Button, useToast } from '../components/ui';

const PRESETS = [
    { label: 'AI Medical Coding & TPA', query: 'Autonomous AI Medical Coding & TPA Insurance Pre-Auth', sector: 'HealthTech & AI' },
    { label: 'WhatsApp B2B Sales SDR', query: 'Autonomous WhatsApp B2B Sales SDR for Distributors', sector: 'Enterprise SaaS' },
    { label: 'Cross-Border Trade OS', query: 'Single-Window Customs & FX Hedging OS for Exporters', sector: 'Fintech & Supply Chain' },
    { label: 'EV Battery Telematics', query: 'EV Battery Telematics & 2nd-Life Grid Energy Storage', sector: 'CleanTech & Mobility' },
    { label: 'Dark Store Demand AI', query: 'Hyperlocal Demand Predictor for Quick Commerce Dark Stores', sector: 'Retail & Quick Commerce' },
];

import { parseMetricData } from '../lib/metricParser';

export default function TrendExplorer() {
    const { toolResults, setToolResult, saveInsight, setAnalysisInput, setContextTags } = useStore();
    const navigate = useNavigate();
    const toast = useToast();
    const cached = toolResults['trends'];

    const [query, setQuery] = useState(cached?.query || '');
    const [sector, setSector] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(cached?.result || null);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);

    const executeAnalysis = async (targetQuery, targetSector) => {
        const q = (targetQuery || query).trim();
        const s = (targetSector !== undefined ? targetSector : sector).trim();
        if (!q) return;

        setLoading(true);
        setError(null);
        setSaved(false);
        setCopied(false);

        try {
            const res = await fetch('/api/tools/trends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: q, sector: s })
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setResult(data);
            setToolResult('trends', q, data);
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
        setSector(preset.sector);
        executeAnalysis(preset.query, preset.sector);
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
        if (ok) {
            setSaved(true);
            toast('Trends saved to insights', 'success');
        }
    };

    const handleCopyMarkdown = async () => {
        if (!result) return;
        let md = `# Market Trends: ${query}\n`;
        if (sector) md += `**Sector:** ${sector}\n\n`;
        if (result.market_size_estimate) md += `- **Market Size Estimate:** ${result.market_size_estimate}\n`;
        if (result.market_growth_cagr) md += `- **Projected CAGR:** ${result.market_growth_cagr}\n\n`;
        
        if (result.key_drivers?.length) {
            md += `### Key Growth Drivers\n`;
            result.key_drivers.forEach(d => { md += `- ${d}\n`; });
            md += `\n`;
        }
        if (result.macro_trends?.length) {
            md += `### Macro Trends\n`;
            result.macro_trends.forEach(t => {
                md += `#### ${t.trend} (${t.relevance_score || 'N/A'}/10)\n${t.description || ''}\n\n`;
            });
        }
        await navigator.clipboard.writeText(md);
        setCopied(true);
        toast('Markdown copied to clipboard', 'success');
        setTimeout(() => setCopied(false), 2500);
    };

    const handleLaunchSwarm = () => {
        setAnalysisInput(`${query}${sector ? ` in ${sector}` : ''}`);
        setContextTags({
            industry: sector ? [sector] : ['Technology'],
            geo: ['Global'],
            segment: ['B2B Mid-Market']
        });
        toast('Loaded hypothesis into Agentic Swarm', 'info');
        navigate('/');
    };

    return (
        <div className="max-w-7xl mx-auto px-8 pt-8 pb-20">

            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Trend Explorer</h1>
                    <p className="text-slate-500 dark:text-slate-400">Discover real-time market shifts and growth signals using agentic search intelligence.</p>
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
                        <label htmlFor="trend-query-input" className="sr-only">Trend topic or hypothesis</label>
                        <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                        <input
                            id="trend-query-input"
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="e.g. AI-powered healthcare diagnostics, dark store replenishment, B2B WhatsApp SDR..."
                            className="w-full pl-10 pr-4 py-2.5 bg-muted/60 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <div className="w-full md:w-56">
                        <label htmlFor="trend-sector-input" className="sr-only">Sector</label>
                        <input
                            id="trend-sector-input"
                            type="text"
                            value={sector}
                            onChange={e => setSector(e.target.value)}
                            placeholder="Sector (e.g. HealthTech)"
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
                        <TrendingUp className="w-4 h-4" aria-hidden="true" /> Explore Trends
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
                        <TrendingUp className="w-8 h-8 animate-bounce" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Analyzing Market Trajectory...</h3>
                    <p className="text-sm text-muted-foreground max-w-md text-center">
                        Searching real-time industry sources and quantitative market sizing benchmarks...
                    </p>
                </div>
            )}

            {/* Empty State */}
            {!loading && !result && !error && (
                <EmptyState
                    icon={TrendingUp}
                    title="No trend research active"
                    description="Enter a startup hypothesis above or select one of our curated sector presets to analyze real-time market sizes, CAGR, and macro growth drivers."
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

                    {/* Metric Cards with Clean Quantitative Hierarchy */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
                        {/* Market Size (TAM) */}
                        {(() => {
                            const { headline, breakdown } = parseMetricData(result.market_size_estimate, 'tam');
                            return (
                                <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-colors flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Market Size (TAM)</span>
                                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary/10 text-primary border border-primary/20">Global Estimate</span>
                                        </div>
                                        <div className="text-2xl font-bold text-primary tracking-tight">
                                            {headline}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">Total Addressable Market projection</p>

                                        <div className="w-full bg-muted/60 h-1.5 rounded-full my-3.5 overflow-hidden">
                                            <div className="bg-primary h-full rounded-full w-3/4 animate-pulse" />
                                        </div>

                                        {breakdown.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-border/60 space-y-2">
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Market Size Breakdown:</div>
                                                <div className="space-y-1.5">
                                                    {breakdown.map((item, i) => (
                                                        <div key={i} className="flex items-start gap-2 text-xs leading-relaxed text-foreground/90 bg-muted/40 dark:bg-muted/20 p-2.5 rounded-lg border border-border/40">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                                            <span>{item}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Projected Growth (CAGR) */}
                        {(() => {
                            const { headline, breakdown } = parseMetricData(result.market_growth_cagr, 'cagr');
                            return (
                                <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-colors flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Projected Growth (CAGR)</span>
                                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                                High Velocity
                                            </span>
                                        </div>
                                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight flex items-baseline gap-2">
                                            {headline}
                                            <ArrowUpRight className="w-4 h-4 text-emerald-500 shrink-0" />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">Compound Annual Growth Rate</p>

                                        <div className="w-full bg-muted/60 h-1.5 rounded-full my-3.5 overflow-hidden">
                                            <div className="bg-emerald-500 h-full rounded-full w-4/5" />
                                        </div>

                                        {breakdown.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-border/60 space-y-2">
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sub-Sector Growth Rates:</div>
                                                <div className="space-y-1.5">
                                                    {breakdown.map((item, i) => (
                                                        <div key={i} className="flex items-start gap-2 text-xs leading-relaxed text-foreground/90 bg-muted/40 dark:bg-muted/20 p-2.5 rounded-lg border border-border/40">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                                            <span>{item}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Adoption Maturity */}
                        <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-violet-500/40 transition-colors flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Adoption Maturity</span>
                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
                                        Phase
                                    </span>
                                </div>
                                <div className="text-2xl font-bold text-foreground tracking-tight">
                                    {result.lifecycle_stage || 'Rapid Expansion'}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Market adoption & saturation velocity</p>
                                
                                {/* Segmented Timeline indicator */}
                                <div className="grid grid-cols-4 gap-1.5 my-3.5">
                                    <div className="h-1.5 rounded-full bg-primary" title="Emerging" />
                                    <div className="h-1.5 rounded-full bg-primary" title="Early Adopters" />
                                    <div className="h-1.5 rounded-full bg-primary/40" title="Mass Adoption" />
                                    <div className="h-1.5 rounded-full bg-muted" title="Saturated" />
                                </div>

                                <div className="mt-3 pt-3 border-t border-border/60 space-y-2">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Adoption Dynamics:</div>
                                    <div className="space-y-1.5 text-xs leading-relaxed">
                                        <div className="flex items-start gap-2 text-foreground/90 bg-muted/40 dark:bg-muted/20 p-2.5 rounded-lg border border-border/40">
                                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                                            <span>Active enterprise expansion with rapid pilot-to-contract conversion velocity.</span>
                                        </div>
                                        <div className="flex items-start gap-2 text-muted-foreground bg-muted/40 dark:bg-muted/20 p-2.5 rounded-lg border border-border/40 text-[11px]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-border mt-1.5 shrink-0" />
                                            <span>Consolidation Window: High urgency for early category lock-in.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Key Drivers Callout */}
                    {result.key_drivers?.length > 0 && (
                        <div className="bg-card rounded-xl p-6 border border-border border-l-4 border-l-primary shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                                    <Award className="w-4 h-4" /> Core Growth Catalysts
                                </h3>
                                <span className="text-xs text-muted-foreground font-medium">{result.key_drivers.length} Drivers Identified</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {result.key_drivers.map((driver, idx) => (
                                    <div key={idx} className="flex items-start gap-3 text-sm text-foreground bg-muted/40 p-3 rounded-lg border border-border/50">
                                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                            {idx + 1}
                                        </div>
                                        <span className="leading-relaxed font-medium">{driver}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Macro Trends */}
                    {result.macro_trends?.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-foreground">Macro Industry Shifts</h2>
                                <span className="text-xs text-muted-foreground">{result.macro_trends.length} Major Trends</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {result.macro_trends.map((trend, idx) => (
                                    <div key={idx} className="bg-card rounded-xl border border-border p-6 shadow-sm hover:border-primary/40 transition-all hover:shadow-md flex flex-col justify-between group">
                                        <div>
                                            <div className="flex items-start justify-between gap-3 mb-2.5">
                                                <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors">{trend.trend}</h3>
                                                {trend.relevance_score && (
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary shrink-0 border border-primary/20">
                                                        {trend.relevance_score}/10 Relevance
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{trend.description}</p>
                                        </div>
                                        {trend.timeframe && (
                                            <div className="text-xs text-muted-foreground flex items-center justify-between pt-3 border-t border-border">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-primary" />
                                                    <span>Horizon: <strong className="text-foreground">{trend.timeframe}</strong></span>
                                                </div>
                                                <span className="text-[11px] font-semibold text-primary/80">Macro Shift</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Micro / Tactical Shifts */}
                    {result.micro_trends?.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-4">Tactical Micro-Shifts</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {result.micro_trends.map((trend, idx) => (
                                    <div key={idx} className="bg-card rounded-xl border border-border p-5 shadow-sm hover:border-border/80 transition-colors">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 mb-2.5" />
                                        <h3 className="font-bold text-foreground text-sm mb-1.5">{trend.trend}</h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{trend.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bottom Bridge CTA banner */}
                    <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border border-primary/25 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                        <div className="max-w-xl">
                            <span className="text-[11px] font-black tracking-widest text-primary uppercase">Agentic Swarm Pipeline</span>
                            <h3 className="font-extrabold text-foreground text-lg sm:text-xl mt-1">Ready to convert these market signals into an institution-grade venture?</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                                Launch our 11-agent intelligence swarm to stress-test unit economics, competitor defensibility moats, adversarial critic red flags, and Go / Pivot / Kill decisioning.
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
