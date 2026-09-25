import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import {
    Share2, ChevronRight, TrendingUp, Users,
    Target, AlertTriangle, CheckCircle, Lightbulb, Wrench,
    Award, XCircle, ExternalLink, Newspaper, Info,
    ArrowLeft, ArrowRight, Printer, Zap, Clock,
    Bookmark, BookmarkCheck, Check, FileDown,
    RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { parseMetricData } from '../lib/metricParser';
import { Button, Badge, useToast } from '../components/ui';

const SECTIONS = [
    { id: 'decision',    label: 'Decision'          },
    { id: 'summary',     label: 'Executive Summary' },
    { id: 'metrics',     label: 'Key Metrics'       },
    { id: 'competitors', label: 'Competitors'        },
    { id: 'trends',      label: 'Trends'             },
    { id: 'validation',  label: 'Market Signals'     },
    { id: 'critic',      label: 'Critical Analysis'  },
    { id: 'ideation',    label: 'Alternatives'       },
];

const Avatar = ({ name, size = 36 }) => {
    const initials = name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';
    const COLORS = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#f43f5e','#8b5cf6','#14b8a6'];
    const color = COLORS[name ? name.charCodeAt(0) % COLORS.length : 0];
    return (
        <div aria-label={name}
            style={{ width: size, height: size, background: `${color}20`, border: `2px solid ${color}40`, color, fontSize: size * 0.35 }}
            className="rounded-full flex items-center justify-center font-bold shrink-0">
            {initials}
        </div>
    );
};

const StatCard = ({ label, value, subtext, icon: Icon, colorClass }) => (
    <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden shadow-sm transition-colors duration-150 hover:border-primary/30 hover:shadow-md">
        <div className="absolute top-[-10px] right-[-10px] opacity-[0.06] pointer-events-none">
            <Icon className={cn('w-20 h-20', colorClass)} aria-hidden="true" />
        </div>
        <div className="flex items-center gap-2 mb-3">
            <div className={cn('p-1.5 rounded-lg', colorClass, 'bg-current/10 flex')}>
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
        </div>
        <div className="text-2xl font-bold text-foreground tracking-tight mb-1">{value}</div>
        <div className="text-xs text-muted-foreground">{subtext}</div>
    </div>
);

const CompetitorCard = ({ competitor }) => (
    <div className="bg-card border border-border rounded-xl p-5 transition-colors duration-150 hover:border-primary/30 hover:shadow-sm shadow-sm">
        <div className="flex items-start gap-3 mb-3">
            <Avatar name={competitor.name} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">{competitor.name}</span>
                    {competitor.funding && <Badge variant="go">{competitor.funding}</Badge>}
                </div>
                {competitor.website && (
                    <a href={competitor.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-primary mt-1 hover:underline">
                        {competitor.website} <ExternalLink className="w-2.5 h-2.5" aria-hidden="true" />
                    </a>
                )}
            </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{competitor.description}</p>
        {competitor.team_size && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
                <Users className="w-3 h-3" aria-hidden="true" /> Team: {competitor.team_size}
            </div>
        )}
        {competitor.strengths?.length > 0 && (
            <div className="mb-2">
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5">Strengths</div>
                {competitor.strengths.slice(0, 2).map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5 mb-1">
                        <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" aria-hidden="true" />
                        <span className="text-[11px] text-foreground">{s}</span>
                    </div>
                ))}
            </div>
        )}
        {competitor.weaknesses?.length > 0 && (
            <div>
                <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1.5">Gaps</div>
                {competitor.weaknesses.slice(0, 2).map((w, i) => (
                    <div key={i} className="flex items-start gap-1.5 mb-1">
                        <XCircle className="w-3 h-3 text-rose-500 mt-0.5 shrink-0" aria-hidden="true" />
                        <span className="text-[11px] text-foreground">{w}</span>
                    </div>
                ))}
            </div>
        )}
    </div>
);

const TrendCard = ({ trend }) => (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm transition-colors duration-150 hover:shadow-md hover:border-primary/30">
        <div className="flex justify-between items-start mb-2">
            <h4 className="text-sm font-bold text-foreground">{trend.trend}</h4>
            {trend.relevance_score && (
                <span className="ml-2 shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    {trend.relevance_score}/10
                </span>
            )}
        </div>
        {trend.description && <p className="text-xs text-muted-foreground leading-relaxed mb-3">{trend.description}</p>}
        <div className="flex gap-3 text-[11px] text-muted-foreground">
            {trend.timeframe && <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" aria-hidden="true" />{trend.timeframe}</span>}
        </div>
        {trend.impact && (
            <div className="mt-2.5 pt-2.5 border-t border-border text-[11px] text-foreground">
                <strong className="text-primary font-semibold">Impact:</strong> {trend.impact}
            </div>
        )}
        {trend.sources?.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-border">
                <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground mb-1">
                    <Newspaper className="w-2.5 h-2.5" aria-hidden="true" /> SOURCES
                </div>
                {trend.sources.map((src, i) => (
                    <a key={i} href={src.url} target="_blank" rel="noopener noreferrer"
                        className="block text-[11px] text-primary hover:underline mb-0.5">
                        {src.headline || src.url}
                    </a>
                ))}
            </div>
        )}
    </div>
);

const ValidationSignalCard = ({ point }) => {
    const sentVariant = point.sentiment === 'positive' ? 'go' : point.sentiment === 'negative' ? 'kill' : 'muted';
    const wtpVariant  = point.willingness_to_pay === 'High' ? 'go' : point.willingness_to_pay === 'Medium' ? 'pivot' : 'muted';
    return (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm transition-colors duration-150 hover:shadow-md">
            <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-bold text-foreground">{point.user_segment}</span>
                <Badge variant={sentVariant} className="ml-2 shrink-0 uppercase">{point.sentiment}</Badge>
            </div>
            <p className="text-xs font-medium text-foreground leading-relaxed mb-3">{point.pain_point}</p>
            {point.sources?.length > 0 ? (
                <div className="mb-3">
                    <div className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">Referenced Headlines</div>
                    {point.sources.map((src, i) => (
                        <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" className="block text-[11px] text-primary hover:underline">{src.headline || src.url}</a>
                    ))}
                </div>
            ) : (
                <div className="flex gap-2 bg-muted rounded-lg px-3 py-2 mb-3">
                    <Info className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-[11px] text-muted-foreground italic">AI-inferred signal. Validate with primary research.</p>
                </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-border">
                <div className="text-[11px]">
                    <span className="text-muted-foreground">Pain Severity: </span>
                    <span className="text-foreground font-bold">{point.severity}/10</span>
                </div>
                <Badge variant={wtpVariant}>WTP: {point.willingness_to_pay}</Badge>
            </div>
        </div>
    );
};

const SectionNav = ({ sections, activeSection, onChange }) => (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5" role="tablist" aria-label="Report sections">
        {sections.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
                <button key={sec.id} role="tab" aria-selected={isActive} onClick={() => onChange(sec.id)}
                    className={cn(
                        'px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                        isActive ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}>
                    {sec.label}
                </button>
            );
        })}
    </div>
);

const ReportHeaderActions = ({ analysisResult, handleExportPDF }) => {
    const { saveInsight, shareReport, currentAnalysisId } = useStore();
    const toast = useToast();
    const [saved, setSaved]   = useState(false);
    const [sharing, setSharing] = useState(false);

    const handleShare = async () => {
        setSharing(true);
        try {
            const sd = analysisResult?.structured_data;
            const coreIdea = sd?.thought_structuring?.core_idea || sd?.synthesis_results?.executive_summary?.slice(0, 60) || 'Market Analysis';
            const analysisId = currentAnalysisId || analysisResult?.id || analysisResult?.analysis_id || 'active-analysis';
            
            const shareRes = await shareReport(analysisId, coreIdea);
            if (shareRes && shareRes.token) {
                const publicUrl = `${window.location.origin}/share/${shareRes.token}`;
                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(publicUrl);
                    toast('Public Supabase permalink copied to clipboard!', 'success');
                } else {
                    prompt('Copy your public report permalink:', publicUrl);
                }
            } else {
                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(window.location.href);
                    toast('Report link copied to clipboard', 'info');
                }
            }
        } catch (err) {
            console.error(err);
            toast('Failed to generate public share link', 'error');
        } finally {
            setSharing(false);
        }
    };

    const handleSave = () => {
        if (!analysisResult) return;
        const sd = analysisResult?.structured_data;
        const coreIdea = sd?.thought_structuring?.core_idea || sd?.synthesis_results?.executive_summary?.slice(0, 60) || 'Market Analysis';
        saveInsight({ 
            id: `report-${Date.now()}`, 
            type: 'report', 
            title: `Report: ${coreIdea}`, 
            query: coreIdea, 
            data: analysisResult, 
            savedAt: Date.now() 
        });
        setSaved(true);
        toast('Report cloud-synced to Supabase Insights', 'success');
    };

    const handleDownloadMarkdown = () => {
        if (!analysisResult) return;
        const md = analysisResult.report_md || '# CoFound.ai Report';
        const idea = analysisResult?.structured_data?.structured_thought?.core_idea || 'Analysis';
        const name = idea.slice(0, 24).replace(/[^a-zA-Z0-9_-]/g, '_');
        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `CoFound_Report_${name}.md`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        toast('Markdown report downloaded', 'info');
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={handleShare} disabled={sharing} title="Create public permalink">
                {sharing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" aria-hidden="true"/>}
                Share Link
            </Button>
            <Button variant="secondary" size="sm" onClick={handleSave} disabled={saved} className={cn(saved && 'text-emerald-700 dark:text-emerald-400')} title="Save to Insights">
                {saved ? <><BookmarkCheck className="w-3.5 h-3.5" aria-hidden="true"/> Cloud Saved</> : <><Bookmark className="w-3.5 h-3.5" aria-hidden="true"/> Save</>}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleDownloadMarkdown} title="Download .md">
                <FileDown className="w-3.5 h-3.5" aria-hidden="true"/> .MD
            </Button>
            <Button variant="primary" size="sm" onClick={handleExportPDF} title="Print / Save PDF">
                <Printer className="w-3.5 h-3.5" aria-hidden="true"/> Export PDF
            </Button>
        </div>
    );
};

export default function Report() {
    const { analysisResult } = useStore();
    const navigate = useNavigate();
    const [activeSectionIdx, setActiveSectionIdx] = useState(0);
    const [portalReady, setPortalReady] = useState(false);
    const contentRef     = useRef(null);
    const printPortalRef = useRef(null);

    useEffect(() => { if (!analysisResult) navigate('/'); }, [analysisResult, navigate]);

    useEffect(() => {
        const c = document.createElement('div'); c.id = 'report-print-portal';
        document.body.appendChild(c); printPortalRef.current = c; setPortalReady(true);
        return () => { if (document.body.contains(c)) document.body.removeChild(c); };
    }, []);

    useEffect(() => {
        const style = document.createElement('style');
        style.id = 'report-print-styles';
        style.textContent = `
            @media print {
                #root { display: none !important; }
                #report-print-portal { display: block !important; }
                @page { margin: 0; size: auto; }
                body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0; padding: 0; background: white; }
                #report-print-portal { font-family: Inter, system-ui, sans-serif; color: #0f172a; background: white; width: 100%; box-sizing: border-box; }
                .print-page-wrapper { padding: 20mm; box-sizing: border-box; }
                .print-cover { height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: 20mm; page-break-after: always; background: linear-gradient(135deg, #f8fafc, #f1f5f9); }
                .print-cover-brand { font-size: 14px; font-weight: 800; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px; }
                .print-cover h1 { font-size: 48px; font-weight: 900; color: #0f172a; margin: 0 0 16px; letter-spacing: -0.02em; line-height: 1.1; }
                .print-cover-meta { font-size: 16px; color: #64748b; font-weight: 500; }
                .ps { page-break-inside: avoid; margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background: white; }
                .ps-title { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin: 0 0 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
                #report-print-portal p, #report-print-portal li { font-size: 13px; color: #334155; line-height: 1.6; margin: 0; }
                .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .g4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
                .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; background: #f8fafc; }
                .card-title { font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
                .metric-card { background: linear-gradient(135deg,#fff,#f8fafc); border-radius: 10px; border: 1px solid #e2e8f0; padding: 16px; text-align: center; }
                .metric-label { font-size: 10px; font-weight: 800; color: #64748b; letter-spacing: .05em; margin-bottom: 6px; }
                .metric-val { font-size: 24px; font-weight: 900; color: #0f172a; margin: 0; }
                .badge { display:inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; margin-bottom: 12px; }
                .go    { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
                .nogo  { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
                .pivot { background: #fef9c3; color: #92400e; border: 1px solid #fde68a; }
                .str { color: #059669; font-size: 12px; margin-top: 4px; font-weight: 500; }
                .gap { color: #dc2626; font-size: 12px; margin-top: 4px; font-weight: 500; }
                ul { padding-left: 20px; margin-top: 8px; } li { margin-bottom: 6px; }
                .section-header { font-size: 18px; font-weight: 900; color: #0f172a; margin: 30px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; page-break-after: avoid; }
            }
            @media screen { #report-print-portal { display: none !important; } }
        `;
        document.head.appendChild(style);
        return () => { document.getElementById('report-print-styles')?.remove(); };
    }, []);

    useEffect(() => {
        if (contentRef.current) contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeSectionIdx]);

    const handleExportPDF = useCallback(() => window.print(), []);
    if (!analysisResult) return null;

    const { structured_data } = analysisResult;
    const synthesis   = structured_data?.synthesis_results   || {};
    const decision    = structured_data?.decision_results    || {};
    const competitors = structured_data?.competitor_results  || {};
    const trends      = structured_data?.trend_results       || {};
    const validation  = structured_data?.validation_results  || {};
    const feasibility = structured_data?.feasibility_results || {};
    const critic      = structured_data?.critic_results      || {};
    const ideation    = structured_data?.ideation_results    || {};

    const availableSections = SECTIONS.filter(sec => {
        if (sec.id === 'decision')    return !!decision.decision;
        if (sec.id === 'summary')     return !!(synthesis.executive_summary_narrative || synthesis.executive_summary || synthesis.summary);
        if (sec.id === 'metrics')     return true;
        if (sec.id === 'competitors') return competitors.direct_competitors?.length > 0;
        if (sec.id === 'trends')      return trends.macro_trends?.length > 0;
        if (sec.id === 'validation')  return validation.validation_points?.length > 0;
        if (sec.id === 'critic')      return critic.fatal_flaws?.length > 0;
        if (sec.id === 'ideation')    return (ideation.variations?.length > 0 || ideation.expanded_ideas?.length > 0);
        return true;
    });

    const activeSection = availableSections[activeSectionIdx];
    const canPrev = activeSectionIdx > 0;
    const canNext = activeSectionIdx < availableSections.length - 1;
    const goTo = id => { const idx = availableSections.findIndex(s => s.id === id); if (idx !== -1) setActiveSectionIdx(idx); };

    // ── Section renderers ──────────────────────────────────────────────────

    const renderDecision = () => {
        const isGO    = decision.decision === 'GO';
        const isPIVOT = decision.decision === 'PIVOT';
        const verdictClass = isGO
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
            : isPIVOT ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800';
        const textClass = isGO ? 'text-emerald-700 dark:text-emerald-300'
            : isPIVOT ? 'text-amber-700 dark:text-amber-300' : 'text-rose-700 dark:text-rose-300';
        const iconBgClass = isGO ? 'bg-emerald-100 dark:bg-emerald-900/40'
            : isPIVOT ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-rose-100 dark:bg-rose-900/40';
        const barClass = isGO ? 'bg-emerald-500' : isPIVOT ? 'bg-amber-500' : 'bg-rose-500';
        const borderClass = isGO ? 'border-emerald-200 dark:border-emerald-800'
            : isPIVOT ? 'border-amber-200 dark:border-amber-800' : 'border-rose-200 dark:border-rose-800';
        const Icon = isGO ? CheckCircle : isPIVOT ? AlertTriangle : XCircle;
        return (
            <div className={cn('rounded-2xl border-2 p-8', verdictClass)}>
                <div className="flex items-center gap-4 mb-4">
                    <div className={cn('p-3 rounded-xl', iconBgClass)}>
                        <Icon className={cn('w-8 h-8', textClass)} aria-hidden="true" />
                    </div>
                    <div>
                        <div className={cn('text-2xl font-bold tracking-tight', textClass)}>
                            Decision: {decision.decision}
                        </div>
                        {decision.confidence_score && (
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-muted-foreground">
                                    Confidence: <strong className={textClass}>{decision.confidence_score}%</strong>
                                </span>
                                <div className="h-1.5 w-28 rounded-full bg-border">
                                    <div className={cn('h-full rounded-full', barClass)} style={{ width: `${decision.confidence_score}%` }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {decision.reasoning && <p className="text-base text-foreground leading-relaxed mb-5">{decision.reasoning}</p>}
                {decision.next_steps?.length > 0 && (
                    <div className={cn('bg-card rounded-xl p-5 border', borderClass)}>
                        <div className={cn('text-xs font-bold uppercase tracking-widest mb-3', textClass)}>Next Steps</div>
                        <div className="flex flex-col gap-2">
                            {decision.next_steps.map((step, i) => (
                                <div key={i} className="flex gap-3 items-start">
                                    <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0', iconBgClass, textClass)}>{i + 1}</div>
                                    <span className="text-sm text-foreground leading-relaxed">{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderSummary = () => (
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10"><Zap className="w-5 h-5 text-primary" aria-hidden="true" /></div>
                <h2 className="text-lg font-semibold text-foreground">Executive Summary</h2>
            </div>
            <div className="px-6 py-5 bg-blue-50/70 dark:bg-slate-800/80 rounded-xl border border-blue-200/80 dark:border-slate-700/80 border-l-4 border-l-primary shadow-sm">
                <p className="text-sm md:text-base text-slate-900 dark:text-slate-100 leading-relaxed font-normal">
                    {synthesis.executive_summary_narrative || synthesis.executive_summary || synthesis.summary || 'No summary available.'}
                </p>
            </div>
        </div>
    );

    const renderMetrics = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Market Saturation" value={competitors.saturation_score ? `${competitors.saturation_score}/10` : 'N/A'} subtext="Competition level" icon={Target}    colorClass="text-rose-500" />
            <StatCard label="Market Growth"      value={trends.market_growth_cagr    || 'N/A'}                                      subtext="Projected CAGR"  icon={TrendingUp} colorClass="text-blue-500" />
            <StatCard label="Validation"          value={validation.overall_verdict   || 'N/A'}                                      subtext="User demand"     icon={Users}      colorClass="text-emerald-500" />
            <StatCard label="Feasibility"         value={feasibility.complexity_score ? `${feasibility.complexity_score}/10` : 'N/A'} subtext="Build complexity" icon={Wrench}  colorClass="text-amber-500" />
        </div>
    );

    const renderCompetitors = () => (
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30"><Target className="w-5 h-5 text-rose-500" aria-hidden="true" /></div>
                <h2 className="text-lg font-semibold text-foreground flex-1">Competitor Landscape</h2>
                {competitors.saturation_score && (
                    <Badge variant={competitors.saturation_score > 7 ? 'kill' : competitors.saturation_score > 4 ? 'pivot' : 'go'}>
                        Saturation: {competitors.saturation_score}/10
                    </Badge>
                )}
            </div>
            {competitors.market_insights && <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{competitors.market_insights}</p>}
            <div>
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Direct Competitors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
                    {competitors.direct_competitors?.map((comp, i) => <CompetitorCard key={i} competitor={comp} />)}
                </div>
            </div>
            {competitors.indirect_competitors?.length > 0 && (
                <div>
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Indirect Competitors</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {competitors.indirect_competitors.map((comp, i) => <CompetitorCard key={i} competitor={comp} />)}
                    </div>
                </div>
            )}
        </div>
    );

    const renderTrends = () => (
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30"><TrendingUp className="w-5 h-5 text-blue-500" aria-hidden="true" /></div>
                <h2 className="text-lg font-semibold text-foreground">Market Trends &amp; Growth</h2>
            </div>
            {(trends.market_size_estimate || trends.market_growth_cagr) && (() => {
                const tamParsed = parseMetricData(trends.market_size_estimate, 'tam');
                const cagrParsed = parseMetricData(trends.market_growth_cagr, 'cagr');
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                        {trends.market_size_estimate && (
                            <div className="p-4 bg-sky-500/5 rounded-xl border border-sky-500/20">
                                <div className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest">Market Size (TAM)</div>
                                <div className="text-xl font-bold text-foreground mt-1">{tamParsed.headline}</div>
                                {tamParsed.breakdown.length > 0 && (
                                    <div className="mt-2.5 pt-2 border-t border-sky-500/10 space-y-1">
                                        {tamParsed.breakdown.map((item, idx) => (
                                            <p key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5 leading-relaxed">
                                                <span className="text-sky-500 font-bold shrink-0">•</span>
                                                <span>{item}</span>
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {trends.market_growth_cagr && (
                            <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Projected Growth (CAGR)</div>
                                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{cagrParsed.headline}</div>
                                {cagrParsed.breakdown.length > 0 && (
                                    <div className="mt-2.5 pt-2 border-t border-emerald-500/10 space-y-1">
                                        {cagrParsed.breakdown.map((item, idx) => (
                                            <p key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5 leading-relaxed">
                                                <span className="text-emerald-500 font-bold shrink-0">•</span>
                                                <span>{item}</span>
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })()}
            {trends.key_drivers?.length > 0 && (
                <div className="bg-blue-50/60 dark:bg-slate-800/60 rounded-xl px-5 py-4 mb-5 border border-blue-200/60 dark:border-slate-700">
                    <div className="text-[11px] font-bold text-primary uppercase tracking-widest mb-3">Key Growth Drivers</div>
                    <div className="flex flex-col gap-2.5">
                        {trends.key_drivers.map((driver, i) => (
                            <div key={i} className="flex gap-2.5 items-start">
                                <Award className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                                <span className="text-sm text-foreground">{driver}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="mb-5">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Macro Trends</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {trends.macro_trends?.map((trend, i) => <TrendCard key={i} trend={trend} />)}
                </div>
            </div>
            {trends.micro_trends?.length > 0 && (
                <div>
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Micro Trends</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {trends.micro_trends.map((trend, i) => <TrendCard key={i} trend={trend} />)}
                    </div>
                </div>
            )}
        </div>
    );

    const renderValidation = () => (
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30"><Users className="w-5 h-5 text-emerald-500" aria-hidden="true" /></div>
                <h2 className="text-lg font-semibold text-foreground">Market Signals</h2>
            </div>
            <div className="flex gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl px-4 py-3 mb-5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-0.5">AI-Inferred Market Signals — Not Real User Quotes</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">Conduct primary research before investment decisions.</p>
                </div>
            </div>
            {validation.overall_verdict && (
                <div className="mb-4">
                    <Badge variant="muted" className="text-sm px-4 py-1.5">Overall: {validation.overall_verdict}</Badge>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                {validation.validation_points?.map((point, i) => <ValidationSignalCard key={i} point={point} />)}
            </div>
            {validation.adoption_barriers?.length > 0 && (
                <div className="bg-amber-50/60 dark:bg-slate-800/60 rounded-xl px-5 py-4 border border-amber-200/60 dark:border-slate-700">
                    <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-3">Adoption Barriers</div>
                    <div className="flex flex-col gap-2.5">
                        {validation.adoption_barriers.map((barrier, i) => (
                            <div key={i} className="flex gap-2.5 items-start">
                                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" aria-hidden="true" />
                                <span className="text-sm text-foreground">{barrier}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderCritic = () => (
        <div className="bg-card border border-rose-200 dark:border-rose-900/60 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30"><AlertTriangle className="w-5 h-5 text-rose-500" aria-hidden="true" /></div>
                <h2 className="text-lg font-semibold text-foreground">Critical Analysis</h2>
            </div>
            <div className="flex flex-col gap-3">
                {critic.fatal_flaws?.map((flaw, i) => (
                    <div key={i} className="px-5 py-4 bg-rose-50/80 dark:bg-slate-800/80 rounded-xl border border-rose-200 dark:border-rose-900/60 border-l-4 border-l-rose-500">
                        <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1.5">Fatal Flaw #{i + 1}</div>
                        <p className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-normal">{flaw}</p>
                    </div>
                ))}
            </div>
            {critic.harsh_feedback && (
                <div className="mt-4 p-4 bg-muted/60 dark:bg-slate-800/60 rounded-xl border border-border italic text-sm text-foreground leading-relaxed">"{critic.harsh_feedback}"</div>
            )}
            {critic.challenged_assumptions?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-rose-200 dark:border-rose-900/50">
                    <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2">Challenged Founder Assumptions</div>
                    <ul className="list-disc pl-4 space-y-1.5">
                        {critic.challenged_assumptions.map((a, i) => <li key={i} className="text-sm text-slate-800 dark:text-slate-200">{a}</li>)}
                    </ul>
                </div>
            )}
            {critic.survival_probability && (
                <div className="mt-5 px-4 py-3 bg-muted/60 dark:bg-slate-800/60 rounded-xl border border-border flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Survival Probability: </span>
                    <span className="text-lg font-bold text-foreground">{critic.survival_probability}</span>
                </div>
            )}
        </div>
    );

    const renderIdeation = () => {
        const variations = ideation.variations || (ideation.expanded_ideas || []).map((v, i) => {
            if (typeof v === 'string') { const parts = v.split(':'); return { title: parts.length > 1 ? parts[0].trim() : `Approach ${i+1}`, description: parts.length > 1 ? parts.slice(1).join(':').trim() : v }; }
            return v;
        });
        const pivots = ideation.pivot_options || [];
        return (
            <div className="flex flex-col gap-6">
                <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30"><Lightbulb className="w-5 h-5 text-amber-500" aria-hidden="true" /></div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Alternative Strategic Wedges</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">High-margin entry points and differentiation vectors.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {variations.map((variation, i) => (
                            <div key={i} className="bg-amber-50/50 dark:bg-slate-800/80 border border-amber-200/80 dark:border-slate-700 rounded-xl p-5 flex flex-col transition-colors duration-150 hover:shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/60 border-2 border-amber-300 dark:border-amber-700 text-[10px] font-bold text-amber-800 dark:text-amber-200 flex items-center justify-center shrink-0">{i + 1}</div>
                                    <div className="text-sm font-bold text-foreground">{variation.title || `Variation ${i + 1}`}</div>
                                </div>
                                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed flex-1">{variation.description || variation}</p>
                                {(variation.target_wedge || variation.monetization) && (
                                    <div className="mt-3 pt-3 border-t border-amber-200/60 dark:border-slate-700/60 flex flex-col gap-1.5">
                                        {variation.target_wedge && <div className="text-[11px] text-amber-700 dark:text-amber-300"><strong>Initial Wedge:</strong> {variation.target_wedge}</div>}
                                        {variation.monetization && <div className="text-[11px] text-amber-700 dark:text-amber-300"><strong>Model:</strong> {variation.monetization}</div>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                {pivots.length > 0 && (
                    <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-1.5 rounded-lg bg-primary/10"><RefreshCw className="w-4 h-4 text-primary" aria-hidden="true" /></div>
                            <h3 className="text-base font-semibold text-foreground">Contingency Pivot Options</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {pivots.map((p, idx) => (
                                <div key={idx} className="bg-muted rounded-xl p-4 border border-border">
                                    <div className="text-sm font-bold text-foreground mb-1.5">{typeof p === 'string' ? `Pivot ${idx + 1}` : p.title}</div>
                                    <div className="text-xs text-muted-foreground leading-relaxed">{typeof p === 'string' ? p : p.rationale}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderSection = id => {
        switch(id) {
            case 'decision':    return renderDecision();
            case 'summary':     return renderSummary();
            case 'metrics':     return renderMetrics();
            case 'competitors': return renderCompetitors();
            case 'trends':      return renderTrends();
            case 'validation':  return renderValidation();
            case 'critic':      return renderCritic();
            case 'ideation':    return renderIdeation();
            default:            return null;
        }
    };

    // ── Print portal ────────────────────────────────────────────────────────
    const printContent = analysisResult && portalReady && printPortalRef.current
        ? ReactDOM.createPortal(
            <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#0f172a', background: 'white' }}>
                <div className="print-cover">
                    <div className="print-cover-brand">CoFound.ai · Agentic Market Intelligence</div>
                    <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#0f172a', margin: '0 0 16px', lineHeight: 1.2 }}>
                        {structured_data?.structured_thought?.core_idea || 'Market Intelligence Report'}
                    </h1>
                    <div className="print-cover-meta">
                        Sector: <strong>{structured_data?.structured_thought?.primary_sector || 'Emerging Market'}</strong> · Evaluated on {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                </div>
                <div className="print-page-wrapper">
                    {decision.decision && (
                        <div className="ps" style={{ borderLeft: decision.decision === 'GO' ? '4px solid #10b981' : decision.decision === 'PIVOT' ? '4px solid #f59e0b' : '4px solid #ef4444' }}>
                            <div className="ps-title">Autopilot Decision</div>
                            <span className={`badge ${decision.decision === 'GO' ? 'go' : decision.decision === 'PIVOT' ? 'pivot' : 'nogo'}`}>{decision.decision} · {decision.confidence_score}% confidence</span>
                            {decision.reasoning && <p style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>{decision.reasoning}</p>}
                            {decision.next_steps?.length > 0 && (
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Recommended Next Steps</div>
                                    <ul style={{ margin: 0 }}>{decision.next_steps.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                </div>
                            )}
                        </div>
                    )}
                    {(synthesis.executive_summary_narrative || synthesis.executive_summary || synthesis.summary) && (
                        <div><div className="section-header">Executive Summary</div>
                            <div className="ps"><p style={{ fontSize: '14px' }}>{synthesis.executive_summary_narrative || synthesis.executive_summary || synthesis.summary}</p></div>
                        </div>
                    )}
                    <div>
                        <div className="section-header">Overview &amp; Metrics</div>
                        <div className="g4 ps" style={{ margin: 0, padding: 0, border: 'none', boxShadow: 'none', background: 'transparent' }}>
                            <div className="metric-card"><div className="metric-label">SATURATION</div><div className="metric-val">{competitors.saturation_score ? `${competitors.saturation_score}/10` : 'N/A'}</div></div>
                            <div className="metric-card"><div className="metric-label">GROWTH (CAGR)</div><div className="metric-val">{trends.market_growth_cagr || 'N/A'}</div></div>
                            <div className="metric-card"><div className="metric-label">VALIDATION</div><div className="metric-val">{validation.overall_verdict || 'N/A'}</div></div>
                            <div className="metric-card"><div className="metric-label">FEASIBILITY</div><div className="metric-val">{feasibility.complexity_score ? `${feasibility.complexity_score}/10` : 'N/A'}</div></div>
                        </div>
                    </div>
                    {competitors.direct_competitors?.length > 0 && (
                        <div>
                            <div className="section-header">Competitor Landscape</div>
                            {competitors.market_insights && <p className="ps" style={{ background: '#f8fafc', border: 'none' }}>{competitors.market_insights}</p>}
                            <div className="g2">
                                {[...(competitors.direct_competitors || []), ...(competitors.indirect_competitors || [])].map((c, i) => (
                                    <div key={i} className="card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div className="card-title">{c.name}</div>
                                            {c.funding && <div style={{ fontSize: '10px', color: '#059669', background: '#d1fae5', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>{c.funding}</div>}
                                        </div>
                                        <p style={{ marginTop: '6px', marginBottom: '10px' }}>{c.description}</p>
                                        {c.strengths?.slice(0, 2).map((s, j) => <div key={j} className="str">+ {s}</div>)}
                                        {c.weaknesses?.slice(0, 2).map((w, j) => <div key={j} className="gap">- {w}</div>)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {trends.macro_trends?.length > 0 && (
                        <div style={{ pageBreakBefore: 'always' }}>
                            <div className="section-header">Market Trends &amp; Growth</div>
                            <div className="g2">
                                {[...(trends.macro_trends || []), ...(trends.micro_trends || [])].map((t, i) => (
                                    <div key={i} className="card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div className="card-title">{t.trend}</div>
                                            {t.relevance_score && <div style={{ fontSize: '10px', color: '#1d4ed8', background: '#dbeafe', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>{t.relevance_score}/10</div>}
                                        </div>
                                        {t.description && <p style={{ marginTop: '6px' }}>{t.description}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {validation.validation_points?.length > 0 && (
                        <div>
                            <div className="section-header">Market Signals</div>
                            <div className="g2">
                                {validation.validation_points.map((pt, i) => (
                                    <div key={i} className="card">
                                        <div className="card-title">{pt.user_segment}</div>
                                        <p style={{ marginTop: '6px', marginBottom: '8px' }}>{pt.pain_point}</p>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>Sev: {pt.severity}/10 · WTP: {pt.willingness_to_pay}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {critic.fatal_flaws?.length > 0 && (
                        <div>
                            <div className="section-header">Critical Analysis</div>
                            <div className="ps" style={{ border: '1px solid #fecaca', background: '#fff1f2' }}>
                                {critic.fatal_flaws.map((flaw, i) => (
                                    <div key={i} style={{ borderLeft: '3px solid #ef4444', paddingLeft: '12px', marginBottom: '12px' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', marginBottom: '4px' }}>Fatal Flaw #{i + 1}</div>
                                        <p style={{ color: '#7f1d1d' }}>{flaw}</p>
                                    </div>
                                ))}
                                {critic.survival_probability && (
                                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #fecaca', fontSize: '14px', fontWeight: 800, color: '#991b1b' }}>
                                        2-Year Survival Probability: {critic.survival_probability}%
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {ideation.variations?.length > 0 && (
                        <div>
                            <div className="section-header">Ideation &amp; Alternatives</div>
                            <div className="g2">
                                {ideation.variations.map((v, i) => (
                                    <div key={i} className="card" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                                        <div className="card-title" style={{ color: '#92400e' }}>{v.title || `Variation ${i + 1}`}</div>
                                        <p style={{ marginTop: '6px', color: '#b45309' }}>{v.description || v}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>,
            printPortalRef.current
        ) : null;

    // ── Main render ─────────────────────────────────────────────────────────
    return (
        <>
            {printContent}
            <div className="min-h-screen bg-background flex flex-col">

                {/* Sticky header */}
                <div className="bg-card/90 backdrop-blur-md border-b border-border sticky top-0 z-30">
                    <div className="max-w-6xl mx-auto px-4 md:px-6 pt-4 pb-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                            <span>Reports</span>
                            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                            <span className="font-semibold text-foreground">Analysis Output</span>
                        </div>
                        <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">Market Intelligence Report</h1>
                                <p className="text-xs text-muted-foreground mt-0.5">Generated {new Date().toLocaleDateString()}</p>
                            </div>
                            <ReportHeaderActions analysisResult={analysisResult} handleExportPDF={handleExportPDF} />
                        </div>
                    </div>
                    <div className="max-w-6xl mx-auto px-4 md:px-6 pb-3 overflow-x-auto">
                        <SectionNav sections={availableSections} activeSection={activeSection?.id} onChange={goTo} />
                    </div>
                </div>

                {/* Content */}
                <div ref={contentRef} className="flex-1 overflow-y-auto">
                    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
                        {activeSection && renderSection(activeSection.id)}
                    </div>
                </div>

                {/* Sticky bottom nav */}
                <div className="bg-card/95 backdrop-blur-md border-t border-border sticky bottom-0 z-30">
                    <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
                        <Button variant="secondary" size="sm" onClick={() => canPrev && setActiveSectionIdx(activeSectionIdx - 1)} disabled={!canPrev}>
                            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                            {canPrev ? availableSections[activeSectionIdx - 1].label : 'Back'}
                        </Button>

                        <div className="flex flex-col items-center gap-1.5">
                            <span className="text-[11px] text-muted-foreground font-semibold">{activeSectionIdx + 1} / {availableSections.length}</span>
                            <div className="flex gap-1" role="tablist" aria-label="Section progress">
                                {availableSections.map((_, i) => (
                                    <button key={i} role="tab" aria-selected={i === activeSectionIdx} aria-label={`Go to section ${i + 1}`}
                                        onClick={() => setActiveSectionIdx(i)}
                                        className={cn('h-1.5 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                                            i === activeSectionIdx ? 'w-4 bg-foreground' : 'w-1.5 bg-border hover:bg-muted-foreground'
                                        )} />
                                ))}
                            </div>
                        </div>

                        <Button variant="secondary" size="sm" onClick={() => canNext && setActiveSectionIdx(activeSectionIdx + 1)} disabled={!canNext}>
                            {canNext ? availableSections[activeSectionIdx + 1].label : 'Done'}
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
