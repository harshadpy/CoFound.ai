import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Bookmark, Trash2, TrendingUp, GitCompare, Target, Lightbulb, FileText, ChevronDown, ChevronUp, ArrowUpRight, AlertTriangle, CheckCircle2, Shuffle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const TYPE_META = {
    trends:       { label: 'Trend Explorer',      icon: TrendingUp,  color: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' },
    competitors:  { label: 'Competitor Research',  icon: GitCompare,  color: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' },
    'market-gaps':{ label: 'Market Gaps',          icon: Target,      color: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' },
    brainstorm:   { label: 'Idea Brainstorming',   icon: Lightbulb,   color: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' },
    report:       { label: 'Full Report',          icon: FileText,    color: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' },
};

function TrendsPreview({ data }) {
    return (
        <div className="space-y-3">
            <div className="flex gap-3">
                <div className="bg-blue-600 text-white rounded-lg px-3 py-2 text-sm font-bold">{data.market_size_estimate}</div>
                <div className="bg-emerald-600 text-white rounded-lg px-3 py-2 text-sm font-bold">{data.market_growth_cagr}</div>
            </div>
            {(data.macro_trends || []).slice(0, 2).map((t, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{t.trend}</span>
                        <span className="text-xs text-blue-600 font-bold">{t.relevance_score}/10</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{t.description}</p>
                </div>
            ))}
        </div>
    );
}

function CompetitorsPreview({ data }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-500 dark:text-slate-400">Saturation:</span>
                <span className={cn("font-black text-lg px-2 py-0.5 rounded",
                    data.saturation_score >= 8 ? 'text-red-600 bg-red-50 dark:bg-red-950' :
                    data.saturation_score >= 5 ? 'text-amber-600 bg-amber-50 dark:bg-amber-950' :
                    'text-emerald-600 bg-emerald-50 dark:bg-emerald-950')}>
                    {data.saturation_score}/10
                </span>
            </div>
            {(data.direct_competitors || []).slice(0, 2).map((c, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                    <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-700 font-bold text-sm">{c.name?.charAt(0)}</div>
                    <div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{c.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{c.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function MarketGapsPreview({ data }) {
    const v = (data.overall_verdict || '').toLowerCase();
    const color = v.includes('strong') ? 'bg-emerald-600' : v.includes('moderate') ? 'bg-amber-500' : 'bg-red-600';
    return (
        <div className="space-y-3">
            <div className={cn("text-white rounded-lg px-3 py-2 text-sm font-bold inline-block", color)}>{data.overall_verdict}</div>
            {(data.validation_points || []).slice(0, 2).map((pt, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-1">{pt.pain_point}</p>
                    <div className="flex gap-2 text-xs">
                        <span className="text-slate-500 dark:text-slate-400">{pt.user_segment}</span>
                        <span>•</span>
                        <span className="font-medium">Pain: {pt.severity}/10</span>
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
                <div key={i} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                    <span className="text-xs font-black text-slate-300 dark:text-slate-600">{String(i + 1).padStart(2, '0')}</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{idea}</p>
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
                <div className={cn("text-white rounded-lg px-3 py-2 text-sm font-bold inline-block",
                    dec.decision === 'GO' ? 'bg-emerald-600' :
                    dec.decision === 'PIVOT' ? 'bg-amber-500' : 'bg-red-600')}>
                    {dec.decision} — {Math.round((dec.confidence || 0) * 100)}% confidence
                </div>
            )}
            {data?.synthesis_output?.key_insights?.slice(0, 2).map((ins, i) => (
                <p key={i} className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">• {ins}</p>
            ))}
        </div>
    );
}

function InsightCard({ insight, onRemove }) {
    const [expanded, setExpanded] = useState(false);
    const meta = TYPE_META[insight.type] || TYPE_META.report;
    const Icon = meta.icon;
    const navigate = useNavigate();
    const date = new Date(insight.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

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
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", meta.color)}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{insight.title}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", meta.color)}>{meta.label}</span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">{date}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                        {insight.type === 'report' && (
                            <button
                                onClick={() => navigate('/report')}
                                className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
                                title="Open full report"
                            >
                                <ArrowUpRight className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => setExpanded(e => !e)}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => onRemove(insight.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                            title="Remove insight"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {insight.query && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 rounded-md px-3 py-1.5 mb-3 italic">
                        Query: "{insight.query}"
                    </p>
                )}

                {expanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        {renderPreview()}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SavedInsights() {
    const { savedInsights, removeInsight, analysisResult, saveInsight } = useStore();
    const [reportSaved, setReportSaved] = useState(false);

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
        if (ok) setReportSaved(true);
    };

    return (
        <div className="max-w-4xl mx-auto px-8 pt-8 pb-20">

            {/* Header */}
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Saved Insights</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        {savedInsights.length > 0
                            ? `${savedInsights.length} saved insight${savedInsights.length !== 1 ? 's' : ''} — stored in your browser`
                            : 'Save results from any tool using the bookmark button'
                        }
                    </p>
                </div>

                {/* Save current report button */}
                {analysisResult && (
                    <button
                        onClick={handleSaveReport}
                        disabled={reportSaved}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors",
                            reportSaved
                                ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 cursor-default"
                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-border dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-700 hover:border-emerald-200"
                        )}
                    >
                        <Bookmark className="w-4 h-4" />
                        {reportSaved ? 'Report Saved!' : 'Save Current Report'}
                    </button>
                )}
            </div>

            {/* Empty state */}
            {savedInsights.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
                        <Bookmark className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-xl font-bold text-slate-400 dark:text-slate-500 mb-2">No saved insights yet</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm">
                        After running any tool (Trends, Competitors, Market Gaps, or Brainstorming), click <strong>"Save to Insights"</strong> to store it here.
                    </p>
                </div>
            )}

            {/* Insights list */}
            {savedInsights.length > 0 && (
                <div className="space-y-4">
                    {savedInsights.map(insight => (
                        <InsightCard key={insight.id} insight={insight} onRemove={removeInsight} />
                    ))}
                </div>
            )}
        </div>
    );
}
