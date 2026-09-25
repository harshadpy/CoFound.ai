import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Bookmark, Trash2, TrendingUp, GitCompare, Target, Lightbulb, FileText, ChevronDown, ChevronUp, ArrowUpRight, AlertTriangle, CheckCircle2, Shuffle, Search, Download, Sparkles, Copy, Check, Edit3, MessageSquare, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { parseMetricData } from '../lib/metricParser';
import { useNavigate } from 'react-router-dom';
import { EmptyState, Button, useToast } from '../components/ui';

const TYPE_META = {
    trends:       { label: 'Trend Explorer',      icon: TrendingUp,  color: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' },
    competitors:  { label: 'Competitor Research',  icon: GitCompare,  color: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' },
    'market-gaps':{ label: 'Market Gaps',          icon: Target,      color: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' },
    brainstorm:   { label: 'Idea Brainstorming',   icon: Lightbulb,   color: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' },
    report:       { label: 'Full Swarm Report',    icon: FileText,    color: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' },
};

function TrendsPreview({ data }) {
    const tamParsed = parseMetricData(data.market_size_estimate, 'tam');
    const cagrParsed = parseMetricData(data.market_growth_cagr, 'cagr');
    return (
        <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
                {data.market_size_estimate && (
                    <div className="bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg px-2.5 py-1 text-xs font-semibold" title={data.market_size_estimate}>
                        TAM: {tamParsed.headline}
                    </div>
                )}
                {data.market_growth_cagr && (
                    <div className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg px-2.5 py-1 text-xs font-semibold" title={data.market_growth_cagr}>
                        CAGR: {cagrParsed.headline}
                    </div>
                )}
            </div>
            {(data.macro_trends || []).slice(0, 2).map((t, i) => (
                <div key={i} className="bg-muted/60 rounded-lg p-3 border border-border">
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-foreground">{t.trend}</span>
                        {t.relevance_score && <span className="text-xs text-primary font-bold">{t.relevance_score}/10</span>}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                </div>
            ))}
        </div>
    );
}

function CompetitorsPreview({ data }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">Market Saturation:</span>
                <span className={cn("font-black text-sm px-2.5 py-0.5 rounded border",
                    data.saturation_score >= 8 ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 border-rose-200' :
                    data.saturation_score >= 5 ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 border-amber-200' :
                    'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200')}>
                    {data.saturation_score || 'N/A'}/10
                </span>
            </div>
            {(data.direct_competitors || []).slice(0, 2).map((c, i) => (
                <div key={i} className="flex items-center gap-3 bg-muted/60 rounded-lg p-3 border border-border">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {c.name?.charAt(0) || 'C'}
                    </div>
                    <div>
                        <p className="font-semibold text-sm text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function MarketGapsPreview({ data }) {
    const v = (data.overall_verdict || '').toLowerCase();
    const color = v.includes('strong') || v.includes('high') ? 'bg-emerald-600' : v.includes('moderate') ? 'bg-amber-500' : 'bg-rose-600';
    return (
        <div className="space-y-3">
            {data.overall_verdict && (
                <div className={cn("text-white rounded-lg px-3 py-1.5 text-xs font-bold inline-block", color)}>
                    {data.overall_verdict}
                </div>
            )}
            {(data.validation_points || []).slice(0, 2).map((pt, i) => (
                <div key={i} className="bg-muted/60 rounded-lg p-3 border border-border">
                    <p className="font-semibold text-sm text-foreground mb-1">{pt.pain_point}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>{pt.user_segment}</span>
                        <span>•</span>
                        <span className="font-medium">Pain: {pt.severity}/10</span>
                        {pt.willingness_to_pay && <span>• WTP: {pt.willingness_to_pay}</span>}
                    </div>
                </div>
            ))}
        </div>
    );
}

function BrainstormPreview({ data }) {
    return (
        <div className="space-y-2">
            {(data.expanded_ideas || []).slice(0, 3).map((idea, i) => (
                <div key={i} className="flex items-start gap-2 bg-muted/60 rounded-lg p-3 border border-border">
                    <span className="text-xs font-black text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                    <p className="text-sm text-foreground line-clamp-2">{idea}</p>
                </div>
            ))}
        </div>
    );
}

function ReportPreview({ data }) {
    const dec = data?.decision_result || {};
    return (
        <div className="space-y-3">
            {dec.decision && (
                <div className={cn("text-white rounded-lg px-3 py-1.5 text-xs font-bold inline-block",
                    dec.decision === 'GO' ? 'bg-emerald-600' :
                    dec.decision === 'PIVOT' ? 'bg-amber-500' : 'bg-rose-600')}>
                    {dec.decision} — {Math.round((dec.confidence || 0) * 100)}% confidence
                </div>
            )}
            {data?.synthesis_output?.key_insights?.slice(0, 2).map((ins, i) => (
                <p key={i} className="text-sm text-foreground line-clamp-2">• {ins}</p>
            ))}
        </div>
    );
}

function InsightCard({ insight, onRemove }) {
    const [expanded, setExpanded] = useState(false);
    const [editingNote, setEditingNote] = useState(false);
    const [noteDraft, setNoteDraft] = useState(insight.founderNote || '');
    const [copied, setCopied] = useState(false);

    const { updateInsightNote, setAnalysisInput, setContextTags } = useStore();
    const meta = TYPE_META[insight.type] || TYPE_META.report;
    const Icon = meta.icon;
    const navigate = useNavigate();
    const toast = useToast();
    const date = new Date(insight.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const handleSaveNote = () => {
        updateInsightNote(insight.id, noteDraft.trim());
        setEditingNote(false);
        toast('Founder note saved', 'success');
    };

    const handleLaunchSwarm = () => {
        setAnalysisInput(insight.query || insight.title);
        setContextTags({
            industry: ['Technology'],
            geo: ['Global'],
            segment: ['B2B Customers']
        });
        toast('Loaded insight into Autonomous Swarm input', 'info');
        navigate('/');
    };

    const handleCopyItemMarkdown = async () => {
        let md = `## ${insight.title}\n`;
        md += `*Type:* ${meta.label} | *Saved:* ${date}\n\n`;
        if (insight.query) md += `> Query: ${insight.query}\n\n`;
        if (insight.founderNote) md += `**Founder Memo:** ${insight.founderNote}\n\n`;
        md += `\`\`\`json\n${JSON.stringify(insight.data, null, 2)}\n\`\`\`\n`;

        await navigator.clipboard.writeText(md);
        setCopied(true);
        toast('Insight copied as markdown', 'success');
        setTimeout(() => setCopied(false), 2000);
    };

    const renderPreview = () => {
        if (!insight.data) return null;
        switch (insight.type) {
            case 'trends':       return <TrendsPreview data={insight.data} />;
            case 'competitors':  return <CompetitorsPreview data={insight.data} />;
            case 'market-gaps':  return <MarketGapsPreview data={insight.data} />;
            case 'brainstorm':   return <BrainstormPreview data={insight.data} />;
            case 'report':       return <ReportPreview data={insight.data} />;
            default:             return null;
        }
    };

    return (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-colors hover:border-primary/30">
            <div className="p-5">
                <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("p-2 rounded-lg shrink-0", meta.color)}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-foreground text-base truncate">{insight.title}</h3>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", meta.color)}>{meta.label}</span>
                                <span className="text-xs text-muted-foreground">{date}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={handleCopyItemMarkdown}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label="Copy item as markdown"
                            title="Copy Markdown"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={handleLaunchSwarm}
                            className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label="Launch autonomous swarm on this insight"
                            title="Analyze as Startup"
                        >
                            <Sparkles className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setExpanded(e => !e)}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={expanded ? "Collapse details" : "Expand details"}
                        >
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => onRemove(insight.id)}
                            className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label="Remove insight"
                            title="Remove"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {insight.query && (
                    <p className="text-xs text-muted-foreground bg-muted/60 rounded-md px-3 py-1.5 mb-3 italic">
                        Query: "{insight.query}"
                    </p>
                )}

                {/* Founder Personal Memo / Note Section */}
                <div className="mt-2 pt-2 border-t border-border">
                    {editingNote ? (
                        <div className="space-y-2 mt-2">
                            <textarea
                                value={noteDraft}
                                onChange={(e) => setNoteDraft(e.target.value)}
                                placeholder="Add your founder memo, next steps, or strategic takeaway..."
                                className="w-full text-xs p-2.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none h-20"
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setEditingNote(false)}>Cancel</Button>
                                <Button variant="primary" size="sm" onClick={handleSaveNote}>Save Note</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start justify-between gap-2">
                            {insight.founderNote ? (
                                <div className="text-xs text-foreground bg-blue-50/50 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 rounded-lg p-2.5 flex-1 flex items-start gap-2">
                                    <MessageSquare className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                    <span className="flex-1">{insight.founderNote}</span>
                                    <button onClick={() => setEditingNote(true)} className="text-primary hover:underline text-[11px] font-semibold">Edit</button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setEditingNote(true)}
                                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 py-1 focus-visible:outline-none"
                                >
                                    <Edit3 className="w-3 h-3" /> Add personal founder note
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Expandable Preview */}
                {expanded && (
                    <div className="mt-3 pt-3 border-t border-border animate-fade-in-up">
                        {renderPreview()}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SavedInsights() {
    const { savedInsights, removeInsight, analysisResult, saveInsight } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [reportSaved, setReportSaved] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    const handleRemove = (id) => {
        removeInsight(id);
        toast('Insight removed', 'info');
    };

    const handleSaveReport = () => {
        if (!analysisResult) return;
        const ok = saveInsight({
            id: Date.now().toString(),
            type: 'report',
            title: `Full Report: ${analysisResult?.thought_structuring?.core_idea || analysisResult?.synthesis?.executive_summary?.slice(0, 60) || 'Market Analysis'}`,
            query: analysisResult?.thought_structuring?.core_idea || '',
            data: analysisResult,
            savedAt: Date.now()
        });
        if (ok) {
            setReportSaved(true);
            toast('Report saved to insights', 'success');
        }
    };

    // Filtered insights by search query & category tab
    const filteredInsights = useMemo(() => {
        return savedInsights.filter(item => {
            const matchesType = filterType === 'all' || item.type === filterType;
            if (!matchesType) return false;

            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            const titleMatch = item.title?.toLowerCase().includes(q);
            const queryMatch = item.query?.toLowerCase().includes(q);
            const noteMatch = item.founderNote?.toLowerCase().includes(q);
            return titleMatch || queryMatch || noteMatch;
        });
    }, [savedInsights, searchQuery, filterType]);

    // Export all saved items into a formatted founder intelligence notebook (.md)
    const handleExportAllDossier = () => {
        if (savedInsights.length === 0) return;

        let md = `# CoFound.ai — Founder Intelligence Notebook\n`;
        md += `Exported: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}\n`;
        md += `Total Insights Saved: ${savedInsights.length}\n\n`;
        md += `---\n\n`;

        savedInsights.forEach((item, idx) => {
            const meta = TYPE_META[item.type] || { label: 'Insight' };
            md += `## ${idx + 1}. [${meta.label}] ${item.title}\n`;
            if (item.query) md += `**Hypothesis:** ${item.query}\n`;
            if (item.founderNote) md += `**Founder Note:** ${item.founderNote}\n`;
            md += `\n\`\`\`json\n${JSON.stringify(item.data, null, 2)}\n\`\`\`\n\n---\n\n`;
        });

        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `CoFound_Founder_Dossier_${Date.now()}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast('Founder notebook (.md) exported!', 'success');
    };

    const categories = [
        { id: 'all', label: 'All' },
        { id: 'trends', label: 'Trends' },
        { id: 'competitors', label: 'Competitors' },
        { id: 'market-gaps', label: 'Market Gaps' },
        { id: 'report', label: 'Reports' },
    ];

    return (
        <div className="max-w-4xl mx-auto px-8 pt-8 pb-20">

            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Saved Insights</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        {savedInsights.length > 0
                            ? `${savedInsights.length} saved finding${savedInsights.length !== 1 ? 's' : ''} stored locally in your browser`
                            : 'Save findings from any research tool or report to build your startup dossier'
                        }
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {savedInsights.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportAllDossier}
                            className="flex items-center gap-1.5"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Export All (.MD)
                        </Button>
                    )}

                    {analysisResult && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSaveReport}
                            disabled={reportSaved}
                            className="flex items-center gap-1.5"
                        >
                            <Bookmark className="w-3.5 h-3.5" />
                            {reportSaved ? 'Report Saved' : 'Save Current Report'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter & Live Search Toolbar */}
            {savedInsights.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-4 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    {/* Category tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setFilterType(cat.id)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors",
                                    filterType === cat.id
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Live search input */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Filter saved items..."
                            className="w-full pl-9 pr-3 py-1.5 bg-muted/60 border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </div>
            )}

            {/* Empty States */}
            {savedInsights.length === 0 ? (
                <EmptyState
                    icon={Bookmark}
                    title="No saved insights yet"
                    description="When exploring Trend Explorer, Competitor Research, or Market Gaps, click 'Save Insight' to curate your startup intelligence repository."
                    action={
                        <Button variant="primary" size="sm" onClick={() => navigate('/trends')}>
                            Explore Trends
                        </Button>
                    }
                />
            ) : filteredInsights.length === 0 ? (
                <EmptyState
                    icon={Search}
                    title="No matching insights found"
                    description={`No saved findings matched "${searchQuery}". Try clearing your search filter.`}
                    action={
                        <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setFilterType('all'); }}>
                            Clear Filters
                        </Button>
                    }
                />
            ) : (
                <div className="space-y-4">
                    {filteredInsights.map(insight => (
                        <InsightCard
                            key={insight.id}
                            insight={insight}
                            onRemove={handleRemove}
                        />
                    ))}
                </div>
            )}

        </div>
    );
}
