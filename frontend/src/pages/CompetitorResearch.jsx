import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Loader2, GitCompare, ShieldAlert, Sparkles, ExternalLink, Bookmark, BookmarkCheck, Copy, Check, ArrowRight, Users, CheckCircle2, XCircle, Award, MapPin, Coins, Info } from 'lucide-react';
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

export default function CompetitorResearch() {
    const { toolResults, setToolResult, saveInsight, setAnalysisInput, setContextTags } = useStore();
    const navigate = useNavigate();
    const toast = useToast();
    const cached = toolResults['competitors'];

    const [query, setQuery] = useState(cached?.query || '');
    const [sector, setSector] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(cached?.result || null);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);
    const [filterTab, setFilterTab] = useState('all'); // 'all' | 'direct' | 'indirect'

    const executeAnalysis = async (targetQuery, targetSector) => {
        const q = (targetQuery || query).trim();
        const s = (targetSector !== undefined ? targetSector : sector).trim();
        if (!q) return;

        setLoading(true);
        setError(null);
        setSaved(false);
        setCopied(false);

        try {
            const res = await fetch('/api/tools/competitors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: q, sector: s })
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setResult(data);
            setToolResult('competitors', q, data);
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
            type: 'competitors',
            title: `Competitors: ${query}`,
            query,
            data: result,
            savedAt: Date.now()
        });
        if (ok) {
            setSaved(true);
            toast('Competitor research saved to insights', 'success');
        }
    };

    const handleCopyMarkdown = async () => {
        if (!result) return;
        let md = `# Competitor Landscape: ${query}\n`;
        if (sector) md += `**Sector:** ${sector}\n\n`;
        if (result.saturation_score) md += `- **Saturation Score:** ${result.saturation_score}/10\n`;
        if (result.market_insights) md += `- **Market Insight:** ${result.market_insights}\n\n`;
        
        if (result.direct_competitors?.length) {
            md += `### Direct Competitors\n`;
            result.direct_competitors.forEach(c => {
                md += `#### ${c.name} (${c.website || 'No website'})\n`;
                md += `${c.description || ''}\n`;
                if (c.strengths?.length) md += `- Strengths: ${c.strengths.join(', ')}\n`;
                if (c.weaknesses?.length) md += `- Gaps: ${c.weaknesses.join(', ')}\n`;
                md += `\n`;
            });
        }
        await navigator.clipboard.writeText(md);
        setCopied(true);
        toast('Competitor markdown copied to clipboard', 'success');
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

    const saturationColor = (score) => {
        if (score >= 8) return 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-900';
        if (score >= 5) return 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-900';
        return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900';
    };

    return (
        <div className="max-w-7xl mx-auto px-8 pt-8 pb-20">

            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Competitor Analysis</h1>
                    <p className="text-slate-500 dark:text-slate-400">Agentic competitive intelligence mapping moats, weaknesses, and market saturation.</p>
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
                        <label htmlFor="competitor-query-input" className="sr-only">Competitor search query</label>
                        <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                        <input
                            id="competitor-query-input"
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="e.g. AI-powered SDR for WhatsApp, medical coding automation..."
                            className="w-full pl-10 pr-4 py-2.5 bg-muted/60 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <div className="w-full md:w-56">
                        <label htmlFor="competitor-sector-input" className="sr-only">Sector</label>
                        <input
                            id="competitor-sector-input"
                            type="text"
                            value={sector}
                            onChange={e => setSector(e.target.value)}
                            placeholder="Sector (e.g. B2B SaaS)"
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
                        <GitCompare className="w-4 h-4" aria-hidden="true" /> Map Rivals
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
                        <GitCompare className="w-8 h-8 animate-bounce" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Scanning Competitor Radar...</h3>
                    <p className="text-sm text-muted-foreground max-w-md text-center">
                        Searching Tavily web indices, mapping direct and indirect market players, and analyzing moats...
                    </p>
                </div>
            )}

            {/* Empty State */}
            {!loading && !result && !error && (
                <EmptyState
                    icon={GitCompare}
                    title="No competitor research active"
                    description="Enter a hypothesis above or select a preset to uncover established rivals, feature overlap, and market saturation scores."
                    action={
                        <Button variant="outline" size="sm" onClick={() => handleApplyPreset(PRESETS[1])}>
                            Try "{PRESETS[1].label}"
                        </Button>
                    }
                />
            )}

            {/* Results Display */}
            {!loading && result && (
                <div className="space-y-8 animate-fade-in-up">

                    {/* Saturation Overview Card with Segmented 10-Bar Visual Meter */}
                    <div className="bg-card border border-border rounded-xl p-6 sm:p-7 shadow-sm">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Market Saturation Index</span>
                                    <span className={cn("text-xs font-extrabold px-2.5 py-0.5 rounded-full border", saturationColor(result.saturation_score || 5))}>
                                        {result.saturation_score >= 8 ? 'Red Ocean Market' : result.saturation_score >= 5 ? 'Moderate Crowding' : 'White Space Opportunity'}
                                    </span>
                                </div>
                                
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                                        {result.saturation_score ? `${result.saturation_score}/10` : '5/10'}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-medium">Competitive Density Rating</span>
                                </div>

                                {/* Segmented 10-Bar Visual Progress Meter */}
                                <div className="grid grid-cols-10 gap-1.5 max-w-md">
                                    {Array.from({ length: 10 }).map((_, i) => {
                                        const score = result.saturation_score || 5;
                                        const active = i < score;
                                        let barColor = 'bg-muted';
                                        if (active) {
                                            if (score >= 8) barColor = 'bg-rose-500';
                                            else if (score >= 5) barColor = 'bg-amber-500';
                                            else barColor = 'bg-emerald-500';
                                        }
                                        return (
                                            <div
                                                key={i}
                                                className={cn("h-2.5 rounded-sm transition-all", barColor)}
                                                title={`Tier ${i + 1}`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-muted/50 p-4 rounded-xl border border-border shrink-0">
                                <div className="text-center px-3 border-r border-border">
                                    <div className="text-2xl font-black text-foreground">{result.direct_competitors?.length || 0}</div>
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase">Direct Rivals</div>
                                </div>
                                <div className="text-center px-3">
                                    <div className="text-2xl font-black text-foreground">{result.indirect_competitors?.length || 0}</div>
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase">Adjacent</div>
                                </div>
                            </div>
                        </div>

                        {/* Market Landscape Intelligence Executive Callout */}
                        {result.market_insights && (
                            <div className="mt-5 p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs sm:text-sm text-foreground/90 leading-relaxed flex items-start gap-3">
                                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-primary block text-xs uppercase tracking-wider mb-1">Competitive Dynamics Summary</span>
                                    <span>{result.market_insights}</span>
                                </div>
                            </div>
                        )}

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-border">
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
                                All Rivals ({(result.direct_competitors?.length || 0) + (result.indirect_competitors?.length || 0)})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterTab('direct')}
                                className={cn(
                                    "text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5",
                                    filterTab === 'direct'
                                        ? "bg-rose-500 text-white"
                                        : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                Direct Competitors ({result.direct_competitors?.length || 0})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterTab('indirect')}
                                className={cn(
                                    "text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5",
                                    filterTab === 'indirect'
                                        ? "bg-violet-600 text-white"
                                        : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                Indirect & Adjacent ({result.indirect_competitors?.length || 0})
                            </button>
                        </div>
                    </div>

                    {/* Direct Competitors Grid */}
                    {(filterTab === 'all' || filterTab === 'direct') && result.direct_competitors?.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5 text-rose-500" /> Direct Competitors
                                </h2>
                                <span className="text-xs text-muted-foreground font-medium">High Moat & Product Overlap</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {result.direct_competitors.map((c, idx) => (
                                    <div key={idx} className="bg-card rounded-xl border border-border p-6 shadow-sm hover:border-rose-500/40 hover:shadow-md transition-all flex flex-col justify-between group">
                                        <div>
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-sm uppercase">
                                                        {c.name?.slice(0, 2) || 'CO'}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors">{c.name}</h3>
                                                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                                            <span className="text-[11px] text-muted-foreground">Direct Incumbent</span>
                                                            {c.headquarters && (
                                                                <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                                                                    <MapPin className="w-2.5 h-2.5 text-primary" /> {c.headquarters}
                                                                </span>
                                                            )}
                                                            {c.funding && (
                                                                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded font-medium">
                                                                    <Coins className="w-2.5 h-2.5" /> {c.funding}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {c.website && (
                                                    <a
                                                        href={c.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-primary flex items-center gap-1 hover:underline p-1 rounded hover:bg-muted"
                                                        title={`Visit ${c.name}`}
                                                    >
                                                        Visit <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed mb-4">{c.description}</p>
                                            
                                            {/* Key Product Features if present */}
                                            {c.key_features?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-4">
                                                    {c.key_features.slice(0, 3).map((feat, fIdx) => (
                                                        <span key={fIdx} className="text-[10px] bg-muted/70 text-muted-foreground px-2 py-0.5 rounded-md font-medium">
                                                            {feat}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3 pt-4 border-t border-border">
                                            {c.strengths?.length > 0 && (
                                                <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-200/40 dark:border-emerald-800/40">
                                                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block mb-1">
                                                        Strengths & Moat
                                                    </span>
                                                    <div className="space-y-1">
                                                        {c.strengths.slice(0, 3).map((s, sIdx) => (
                                                            <div key={sIdx} className="flex items-start gap-1.5 text-xs text-foreground/90 font-medium">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                                                <span className="leading-tight">{s}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {c.weaknesses?.length > 0 && (
                                                <div className="bg-rose-50/40 dark:bg-rose-950/20 p-2.5 rounded-lg border border-rose-200/40 dark:border-rose-800/40">
                                                    <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider block mb-1">
                                                        Vulnerabilities / Wedge Opportunities
                                                    </span>
                                                    <div className="space-y-1">
                                                        {c.weaknesses.slice(0, 3).map((w, wIdx) => (
                                                            <div key={wIdx} className="flex items-start gap-1.5 text-xs text-foreground/90 font-medium">
                                                                <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                                                                <span className="leading-tight">{w}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Indirect Competitors */}
                    {(filterTab === 'all' || filterTab === 'indirect') && result.indirect_competitors?.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-foreground">Adjacent & Indirect Players</h2>
                                <span className="text-xs text-muted-foreground font-medium">Potential Partners or Substitutes</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {result.indirect_competitors.map((c, idx) => (
                                    <div key={idx} className="bg-card rounded-xl border border-border p-5 shadow-sm hover:border-violet-500/40 transition-all flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-7 h-7 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xs uppercase">
                                                    {c.name?.slice(0, 2) || 'AD'}
                                                </div>
                                                <h3 className="font-bold text-foreground text-sm">{c.name}</h3>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed mb-3">{c.description}</p>
                                        </div>
                                        <div className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 pt-2 border-t border-border">
                                            Adjacent Platform
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bottom Bridge CTA banner */}
                    <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border border-primary/25 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                        <div className="max-w-xl">
                            <span className="text-[11px] font-black tracking-widest text-primary uppercase">Agentic Defensibility Engineering</span>
                            <h3 className="font-extrabold text-foreground text-lg sm:text-xl mt-1">Ready to build your defensible differentiation moat?</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                                Deploy our agentic swarm to formulate counter-positioning angles, calculate customer acquisition wedges, and stress-test unfair advantages against incumbent rivals.
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
