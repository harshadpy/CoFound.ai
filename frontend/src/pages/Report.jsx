import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useStore } from '../store/useStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Share2, ChevronRight, ChevronLeft, TrendingUp, Users,
    Target, AlertTriangle, CheckCircle, Lightbulb, Wrench,
    Award, XCircle, ExternalLink, Newspaper, Info,
    ArrowLeft, ArrowRight, Printer, Zap, Clock,
    Bookmark, BookmarkCheck, Check, FileDown,
    RefreshCw, Loader2, DollarSign, Layers,
    ShieldCheck, HelpCircle, CheckCircle2, ListChecks,
    Flame, Building, MapPin, Activity, FileText, Sparkles,
    Quote, ShieldAlert
} from 'lucide-react';
import { cn } from '../lib/utils';
import { parseMetricData } from '../lib/metricParser';
import { Button, Badge, useToast } from '../components/ui';

const SECTIONS = [
    { id: 'decision',    label: 'Decision & Verdict' },
    { id: 'summary',     label: 'Executive Summary' },
    { id: 'metrics',     label: 'Metrics & Unit Economics' },
    { id: 'competitors', label: 'Competitors & Gaps' },
    { id: 'trends',      label: 'Market & CAGR' },
    { id: 'validation',  label: 'Market Signals & Experiments' },
    { id: 'critic',      label: 'Adversarial Critique' },
    { id: 'ideation',    label: 'Alternative Wedges' },
];

const Avatar = ({ name, size = 36 }) => {
    const initials = name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';
    const COLORS = ['#4f46e5','#0284c7','#059669','#d97706','#e11d48','#7c3aed','#0d9488'];
    const color = COLORS[name ? name.charCodeAt(0) % COLORS.length : 0];
    return (
        <div
            aria-label={name}
            style={{ width: size, height: size, background: `${color}20`, border: `1.5px solid ${color}60`, color, fontSize: size * 0.36 }}
            className="rounded-full flex items-center justify-center font-bold shrink-0 select-none">
            {initials}
        </div>
    );
};

const StatCard = ({ label, value, subtext, icon: Icon, colorClass, highlight }) => (
    <div className={cn(
        "bg-card/90 dark:bg-slate-900/70 border border-border/80 rounded-2xl p-5 relative overflow-hidden shadow-sm transition-all duration-150 hover:border-primary/40 hover:shadow-md",
        highlight && "bg-primary/[0.03] border-primary/30"
    )}>
        <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
            <div className={cn('p-2 rounded-lg bg-muted/80 flex items-center justify-center', colorClass)}>
                <Icon className="w-4 h-4" aria-hidden="true" />
            </div>
        </div>
        <div className="text-2xl md:text-3xl font-black text-foreground tracking-tight leading-none mb-2">{value}</div>
        <div className="text-xs text-muted-foreground leading-relaxed">{subtext}</div>
    </div>
);

const CompetitorCard = ({ competitor }) => (
    <div className="bg-card/90 dark:bg-slate-900/70 border border-border/80 rounded-2xl p-5 flex flex-col justify-between transition-all duration-150 hover:border-primary/40 hover:shadow-md shadow-sm">
        <div>
            <div className="flex items-start gap-3 mb-3">
                <Avatar name={competitor.name} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground truncate">{competitor.name}</span>
                        {competitor.funding && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                {competitor.funding}
                            </span>
                        )}
                    </div>
                    {competitor.website && (
                        <a href={competitor.website.startsWith('http') ? competitor.website : `https://${competitor.website}`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1 truncate max-w-full font-medium">
                            <span className="truncate">{competitor.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                        </a>
                    )}
                </div>
            </div>

            <p className="text-xs md:text-[13px] text-muted-foreground leading-relaxed mb-3.5">{competitor.description}</p>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3.5">
                {competitor.headquarters && (
                    <span className="inline-flex items-center gap-1.5 bg-muted/70 px-2.5 py-1 rounded-lg border border-border/50">
                        <MapPin className="w-3 h-3 text-muted-foreground" /> {competitor.headquarters}
                    </span>
                )}
                {competitor.team_size && (
                    <span className="inline-flex items-center gap-1.5 bg-muted/70 px-2.5 py-1 rounded-lg border border-border/50">
                        <Users className="w-3 h-3 text-muted-foreground" /> Team: {competitor.team_size}
                    </span>
                )}
            </div>

            {competitor.strengths?.length > 0 && (
                <div className="mb-3">
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Core Strengths
                    </div>
                    {competitor.strengths.slice(0, 2).map((s, i) => (
                        <div key={i} className="flex items-start gap-2 mb-1.5 text-xs text-foreground leading-relaxed">
                            <span className="text-emerald-500 font-bold shrink-0">•</span>
                            <span>{s}</span>
                        </div>
                    ))}
                </div>
            )}

            {competitor.weaknesses?.length > 0 && (
                <div className="mb-3">
                    <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Gaps &amp; Vulnerabilities
                    </div>
                    {competitor.weaknesses.slice(0, 2).map((w, i) => (
                        <div key={i} className="flex items-start gap-2 mb-1.5 text-xs text-foreground leading-relaxed">
                            <span className="text-rose-500 font-bold shrink-0">•</span>
                            <span>{w}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {competitor.differentiation_angle && (
            <div className="mt-3 pt-3 border-t border-border/80 text-xs bg-primary/[0.04] -mx-5 -mb-5 p-3.5 rounded-b-2xl border-t leading-relaxed">
                <span className="font-bold text-primary">Differentiation Angle: </span>
                <span className="text-foreground/90">{competitor.differentiation_angle}</span>
            </div>
        )}
    </div>
);

const TrendCard = ({ trend }) => (
    <div className="bg-card/90 dark:bg-slate-900/70 border border-border/80 rounded-2xl p-5 shadow-sm transition-all duration-150 hover:shadow-md hover:border-primary/40 flex flex-col justify-between">
        <div>
            <div className="flex justify-between items-start gap-2 mb-2">
                <h4 className="text-sm font-bold text-foreground leading-snug">{trend.trend}</h4>
                {trend.relevance_score && (
                    <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-primary/15 text-primary border border-primary/25">
                        {trend.relevance_score}/10
                    </span>
                )}
            </div>
            {trend.timeframe && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2.5">
                    <Clock className="w-3 h-3 text-primary/70" aria-hidden="true" />
                    <span>Horizon: <strong className="text-foreground">{trend.timeframe}</strong></span>
                </div>
            )}
            {trend.description && (
                <p className="text-xs md:text-[13px] text-muted-foreground leading-relaxed mb-3">{trend.description}</p>
            )}
        </div>
        <div>
            {trend.impact && (
                <div className="pt-2.5 border-t border-border/80 text-xs text-foreground mb-2.5 leading-relaxed">
                    <strong className="text-primary font-bold">Strategic Impact: </strong> {trend.impact}
                </div>
            )}
            {trend.sources?.length > 0 && (
                <div className="pt-2.5 border-t border-border/80">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Newspaper className="w-3 h-3 text-primary" /> Sources &amp; Citations
                    </div>
                    {trend.sources.map((src, i) => (
                        <a key={i} href={src.url || '#'} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mr-3 mb-1 truncate max-w-full font-medium">
                            <span className="truncate">{src.headline || src.url}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                    ))}
                </div>
            )}
        </div>
    </div>
);

const ValidationSignalCard = ({ point }) => {
    const isVerified = point.evidence_type === 'verified_finding' || (point.sources && point.sources.length > 0);
    const sentVariant = point.sentiment === 'positive' ? 'go' : point.sentiment === 'negative' ? 'kill' : 'muted';
    const wtpVariant  = point.willingness_to_pay === 'High' ? 'go' : point.willingness_to_pay === 'Medium' ? 'pivot' : 'muted';

    return (
        <div className="bg-card/90 dark:bg-slate-900/80 border border-border/80 rounded-2xl p-6 shadow-sm transition-all duration-150 hover:shadow-md hover:border-primary/40 flex flex-col justify-between">
            <div>
                {/* Header: User segment + Verification & Sentiment badges */}
                <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                    <span className="text-sm font-bold text-foreground tracking-tight leading-snug">{point.user_segment}</span>
                    <div className="flex items-center gap-2 flex-wrap">
                        {isVerified ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" /> Verified Finding
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                <HelpCircle className="w-3 h-3" /> Hypothesis (Needs Test)
                            </span>
                        )}
                        <Badge variant={sentVariant} className="text-[11px] px-2 py-0.5 uppercase font-bold">{point.sentiment}</Badge>
                    </div>
                </div>

                {/* Core pain point description */}
                <p className="text-xs md:text-sm font-medium text-foreground leading-relaxed mb-3.5">
                    {point.pain_point}
                </p>

                {/* Grounded customer statement / pull quote */}
                {point.quote && (
                    <div className="relative pl-3.5 py-2 border-l-2 border-primary bg-primary/[0.04] rounded-r-xl my-3">
                        <p className="text-xs md:text-[13px] italic text-foreground/90 leading-relaxed font-normal">
                            "{point.quote}"
                        </p>
                    </div>
                )}

                {/* Corroborating sources */}
                {point.sources?.length > 0 && (
                    <div className="my-3 space-y-1.5">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Newspaper className="w-3 h-3 text-primary" /> Corroborating Evidence &amp; Links
                        </div>
                        <div className="flex flex-col gap-1.5">
                            {point.sources.map((src, i) => (
                                <a key={i} href={src.url || '#'} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted text-xs text-primary hover:underline transition-colors border border-border/60 group">
                                    <ExternalLink className="w-3 h-3 shrink-0 text-muted-foreground group-hover:text-primary" />
                                    <span className="truncate font-medium">{src.headline || src.url}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Methodology note */}
                {point.evidence_notes && (
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground leading-relaxed my-3">
                        <strong className="text-foreground">Methodology Note: </strong>
                        {point.evidence_notes}
                    </div>
                )}
            </div>

            {/* Bottom metrics */}
            <div className="flex justify-between items-center pt-3.5 border-t border-border mt-2 text-xs">
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Pain Severity:</span>
                    <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded-md text-xs border border-border/60">
                        {point.severity}/10
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">WTP:</span>
                    <Badge variant={wtpVariant} className="text-xs font-bold">{point.willingness_to_pay}</Badge>
                </div>
            </div>
        </div>
    );
};

const SectionNav = ({ sections, activeSection, onChange }) => {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftState, setScrollLeftState] = useState(0);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, []);

    useEffect(() => {
        checkScroll();
        const handleResize = () => checkScroll();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [checkScroll, sections]);

    // Convert mouse wheel vertical scrolls to horizontal scrolling
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const onWheel = (e) => {
            if (el.scrollWidth > el.clientWidth && e.deltaY !== 0) {
                e.preventDefault();
                el.scrollLeft += e.deltaY;
                checkScroll();
            }
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [checkScroll]);

    // Auto-scroll active tab into view when activeSection changes
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const activeBtn = el.querySelector('[aria-selected="true"]');
        if (activeBtn) {
            activeBtn.scrollIntoView({
                behavior: 'smooth',
                inline: 'nearest',
                block: 'nearest'
            });
            setTimeout(checkScroll, 320);
        }
    }, [activeSection, checkScroll]);

    const scrollByAmount = (offset) => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
        setTimeout(checkScroll, 320);
    };

    // Drag-to-scroll support for mouse users
    const handleMouseDown = (e) => {
        if (!scrollRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeftState(scrollRef.current.scrollLeft);
    };

    const handleMouseLeaveOrUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 1.5;
        scrollRef.current.scrollLeft = scrollLeftState - walk;
        checkScroll();
    };

    return (
        <div className="relative flex items-center w-full group/nav">
            {/* Left Scroll Button */}
            {canScrollLeft && (
                <button
                    type="button"
                    onClick={() => scrollByAmount(-240)}
                    aria-label="Scroll sections left"
                    className="absolute -left-1 z-20 flex items-center justify-center w-7 h-7 rounded-full bg-background/95 border border-border shadow-md hover:bg-muted text-foreground transition-all duration-150 shrink-0">
                    <ChevronLeft className="w-4 h-4" />
                </button>
            )}

            {/* Left fade gradient */}
            {canScrollLeft && (
                <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
            )}

            {/* Scrollable Track */}
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeaveOrUp}
                onMouseUp={handleMouseLeaveOrUp}
                onMouseMove={handleMouseMove}
                className={cn(
                    "flex gap-2 overflow-x-auto py-1.5 px-1 scroll-smooth select-none w-full",
                    isDragging ? "cursor-grabbing" : "cursor-grab",
                    "[scrollbar-width:thin] [scrollbar-color:hsl(var(--muted-foreground)/0.25)_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50"
                )}
                role="tablist"
                aria-label="Report sections"
            >
                {sections.map((sec) => {
                    const isActive = activeSection === sec.id;
                    return (
                        <button
                            key={sec.id}
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => onChange(sec.id)}
                            className={cn(
                                'px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 shrink-0',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                                isActive
                                    ? 'bg-foreground text-background shadow-md scale-[1.02]'
                                    : 'bg-muted/80 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/40'
                            )}>
                            {sec.label}
                        </button>
                    );
                })}
            </div>

            {/* Right fade gradient */}
            {canScrollRight && (
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background via-background/80 to-transparent z-10" />
            )}

            {/* Right Scroll Button */}
            {canScrollRight && (
                <button
                    type="button"
                    onClick={() => scrollByAmount(240)}
                    aria-label="Scroll sections right"
                    className="absolute -right-1 z-20 flex items-center justify-center w-7 h-7 rounded-full bg-background/95 border border-border shadow-md hover:bg-muted text-foreground transition-all duration-150 shrink-0">
                    <ChevronRight className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

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
                    toast('Public permalink copied to clipboard!', 'success');
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
                {saved ? <><BookmarkCheck className="w-3.5 h-3.5" aria-hidden="true"/> Saved</> : <><Bookmark className="w-3.5 h-3.5" aria-hidden="true"/> Save</>}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleDownloadMarkdown} title="Download .md">
                <FileDown className="w-3.5 h-3.5" aria-hidden="true"/> .MD
            </Button>
            <Button variant="primary" size="sm" onClick={handleExportPDF} title="Print or Save as PDF">
                <Printer className="w-3.5 h-3.5" aria-hidden="true"/> Export PDF
            </Button>
        </div>
    );
};

export default function Report() {
    const { analysisResult, currentAnalysisId, fetchAndSaveReport } = useStore();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const queryId = searchParams.get('id');
    const [activeSectionIdx, setActiveSectionIdx] = useState(0);
    const [portalReady, setPortalReady] = useState(false);
    const [loading, setLoading] = useState(!analysisResult);
    const printPortalRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        const targetId = queryId || currentAnalysisId;

        if (!analysisResult) {
            if (targetId) {
                setLoading(true);
                fetchAndSaveReport(targetId).then((res) => {
                    if (!isMounted) return;
                    setLoading(false);
                    if (!res) navigate('/');
                }).catch(() => {
                    if (isMounted) {
                        setLoading(false);
                        navigate('/');
                    }
                });
            } else {
                navigate('/');
            }
        } else {
            setLoading(false);
        }

        return () => { isMounted = false; };
    }, [analysisResult, queryId, currentAnalysisId, fetchAndSaveReport, navigate]);

    useEffect(() => {
        const c = document.createElement('div');
        c.id = 'report-print-portal';
        document.body.appendChild(c);
        printPortalRef.current = c;
        setPortalReady(true);
        return () => {
            if (document.body.contains(c)) document.body.removeChild(c);
        };
    }, []);

    useEffect(() => {
        const style = document.createElement('style');
        style.id = 'report-print-styles';
        style.textContent = `
            @page {
                size: A4 portrait;
                margin: 12mm 14mm 14mm 14mm;
            }
            @media print {
                html, body {
                    background: #ffffff !important;
                    color: #0f172a !important;
                    font-size: 10pt;
                    line-height: 1.45;
                    margin: 0 !important;
                    padding: 0 !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                #root { display: none !important; }
                #report-print-portal {
                    display: block !important;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: white;
                    color: #0f172a;
                    width: 100%;
                    box-sizing: border-box;
                }
                .print-cover {
                    min-height: 250mm;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 24mm 16mm;
                    box-sizing: border-box;
                    page-break-after: always;
                    break-after: page;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                }
                .print-cover-brand {
                    font-size: 11pt;
                    font-weight: 800;
                    color: #2563eb;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }
                .print-cover-title {
                    font-size: 26pt;
                    font-weight: 900;
                    color: #0f172a;
                    margin: 16px 0 12px;
                    line-height: 1.2;
                    letter-spacing: -0.02em;
                }
                .print-cover-meta {
                    font-size: 11pt;
                    color: #475569;
                    line-height: 1.5;
                }
                .print-cover-verdict-box {
                    background: white;
                    border: 1.5px solid #cbd5e1;
                    border-radius: 8px;
                    padding: 16px 20px;
                    margin-top: 24px;
                }
                .print-page-wrapper {
                    padding: 8mm 0;
                    box-sizing: border-box;
                }
                .avoid-break {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                }
                .page-break {
                    page-break-before: always !important;
                    break-before: page !important;
                }
                .section-header {
                    font-size: 13pt;
                    font-weight: 900;
                    color: #0f172a;
                    margin: 22px 0 10px;
                    padding-bottom: 6px;
                    border-bottom: 2px solid #e2e8f0;
                    page-break-after: avoid !important;
                    break-after: avoid !important;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                }
                .ps {
                    margin-bottom: 14px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 14px 16px;
                    background: white;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                }
                .g2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin-bottom: 12px;
                }
                .g3 {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 8px;
                    margin-bottom: 12px;
                }
                .g4 {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 8px;
                    margin-bottom: 12px;
                }
                .card {
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 10px 12px;
                    background: #f8fafc;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                }
                .card-title {
                    font-size: 10pt;
                    font-weight: 800;
                    color: #0f172a;
                    margin-bottom: 4px;
                }
                .metric-card {
                    background: #ffffff;
                    border-radius: 6px;
                    border: 1px solid #cbd5e1;
                    padding: 10px 12px;
                    text-align: center;
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
                .metric-label {
                    font-size: 8pt;
                    font-weight: 800;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: .05em;
                    margin-bottom: 4px;
                }
                .metric-val {
                    font-size: 16pt;
                    font-weight: 900;
                    color: #0f172a;
                    margin: 0;
                    line-height: 1.1;
                }
                .badge-print {
                    display: inline-block;
                    padding: 2px 7px;
                    border-radius: 4px;
                    font-size: 8pt;
                    font-weight: 800;
                    text-transform: uppercase;
                }
                .badge-verified {
                    background: #dcfce7;
                    color: #166534;
                    border: 1px solid #bbf7d0;
                }
                .badge-hypo {
                    background: #fef3c7;
                    color: #92400e;
                    border: 1px solid #fde68a;
                }
                .badge-go {
                    background: #d1fae5;
                    color: #065f46;
                    border: 1px solid #a7f3d0;
                }
                .badge-pivot {
                    background: #fef9c3;
                    color: #854d0e;
                    border: 1px solid #fde047;
                }
                .badge-kill {
                    background: #fee2e2;
                    color: #991b1b;
                    border: 1px solid #fca5a5;
                }
                .print-footer-bar {
                    display: flex;
                    justify-content: space-between;
                    font-size: 7.5pt;
                    color: #94a3b8;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 6px;
                    margin-top: 16px;
                }
                p, li {
                    font-size: 9.5pt;
                    color: #334155;
                    line-height: 1.45;
                }
                ul {
                    margin: 4px 0 0;
                    padding-left: 18px;
                }
                li {
                    margin-bottom: 4px;
                }
                a {
                    color: #2563eb;
                    text-decoration: none;
                }
            }
            @media screen {
                #report-print-portal { display: none !important; }
            }
        `;
        document.head.appendChild(style);
        return () => { document.getElementById('report-print-styles')?.remove(); };
    }, []);

    // Smooth window scroll on section tab change
    const scrollToSection = (idx) => {
        setActiveSectionIdx(idx);
        window.scrollTo({ top: 120, behavior: 'smooth' });
    };

    const handleExportPDF = useCallback(() => window.print(), []);

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground font-medium">Loading verified market intelligence report...</p>
            </div>
        );
    }

    if (!analysisResult) return null;

    const { structured_data } = analysisResult;
    const structured  = structured_data?.structured_thought  || {};
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
        if (sec.id === 'trends')      return trends.macro_trends?.length > 0 || !!trends.market_growth_cagr;
        if (sec.id === 'validation')  return validation.validation_points?.length > 0;
        if (sec.id === 'critic')      return critic.fatal_flaws?.length > 0;
        if (sec.id === 'ideation')    return (ideation.variations?.length > 0 || ideation.expanded_ideas?.length > 0);
        return true;
    });

    const activeSection = availableSections[activeSectionIdx];
    const canPrev = activeSectionIdx > 0;
    const canNext = activeSectionIdx < availableSections.length - 1;
    const goTo = id => {
        const idx = availableSections.findIndex(s => s.id === id);
        if (idx !== -1) scrollToSection(idx);
    };

    // ── Section renderers ──────────────────────────────────────────────────

    const renderDecision = () => {
        const isGO    = decision.decision === 'GO';
        const isPIVOT = decision.decision === 'PIVOT';
        const verdictClass = isGO
            ? 'bg-emerald-500/5 border-emerald-500/30'
            : isPIVOT ? 'bg-amber-500/5 border-amber-500/30'
            : 'bg-rose-500/5 border-rose-500/30';
        const textClass = isGO ? 'text-emerald-700 dark:text-emerald-400'
            : isPIVOT ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400';
        const iconBgClass = isGO ? 'bg-emerald-500/15' : isPIVOT ? 'bg-amber-500/15' : 'bg-rose-500/15';
        const barClass = isGO ? 'bg-emerald-500' : isPIVOT ? 'bg-amber-500' : 'bg-rose-500';
        const Icon = isGO ? CheckCircle : isPIVOT ? AlertTriangle : XCircle;

        return (
            <div className="space-y-6">
                <div className={cn('rounded-3xl border-2 p-6 md:p-8 shadow-sm', verdictClass)}>
                    <div className="flex items-center gap-4 mb-4 flex-wrap">
                        <div className={cn('p-3.5 rounded-2xl shrink-0', iconBgClass)}>
                            <Icon className={cn('w-9 h-9', textClass)} aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className={cn('text-2xl md:text-3xl font-black tracking-tight', textClass)}>
                                    Verdict: {decision.decision}
                                </span>
                                <Badge variant={isGO ? 'go' : isPIVOT ? 'pivot' : 'kill'} className="text-xs font-bold uppercase tracking-wider px-3 py-1">
                                    Institutional Decision
                                </Badge>
                            </div>
                            {decision.confidence_score !== undefined && (
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                    <span className="text-xs text-muted-foreground font-semibold">
                                        Calibrated Confidence: <strong className={textClass}>{decision.confidence_score}%</strong>
                                    </span>
                                    <div className="h-2 w-32 rounded-full bg-border overflow-hidden">
                                        <div className={cn('h-full rounded-full transition-all duration-500', barClass)} style={{ width: `${decision.confidence_score}%` }} />
                                    </div>
                                    {critic.survival_probability && (
                                        <span className="text-xs text-muted-foreground font-semibold border-l border-border pl-3">
                                            2-Year Survival Probability: <strong className="text-foreground">{critic.survival_probability}%</strong>
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {decision.reasoning && (
                        <p className="text-sm md:text-base text-foreground leading-relaxed mb-4 font-normal">
                            {decision.reasoning}
                        </p>
                    )}

                    {decision.confidence_explanation && (
                        <div className="mb-4 p-4 rounded-xl bg-background/80 border border-border text-xs md:text-sm text-muted-foreground leading-relaxed">
                            <strong className="text-foreground">Calibration &amp; Uncertainty: </strong>
                            {decision.confidence_explanation}
                        </div>
                    )}

                    {decision.evidence_synthesis && (
                        <div className="p-4 rounded-2xl bg-card border border-border text-xs md:text-sm text-foreground mb-4">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1.5 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4" /> Sourced Evidence Synthesis
                            </div>
                            <p className="leading-relaxed text-muted-foreground">{decision.evidence_synthesis}</p>
                        </div>
                    )}

                    {decision.key_assumptions?.length > 0 && (
                        <div className="mb-4 pt-4 border-t border-border">
                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
                                <HelpCircle className="w-4 h-4" /> Critical Load-Bearing Assumptions
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {decision.key_assumptions.map((assump, i) => (
                                    <div key={i} className="flex items-start gap-2.5 text-xs md:text-sm text-foreground bg-background/60 p-3 rounded-xl border border-border/70 leading-relaxed">
                                        <span className="text-primary font-bold shrink-0">•</span>
                                        <span>{assump}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {decision.kill_conditions?.length > 0 && (
                        <div className="mb-4 pt-4 border-t border-border">
                            <div className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2.5 flex items-center gap-1.5">
                                <Flame className="w-4 h-4" /> Kill Conditions (When to Halt or Pivot)
                            </div>
                            <div className="space-y-2">
                                {decision.kill_conditions.map((kc, i) => (
                                    <div key={i} className="flex items-start gap-2.5 text-xs md:text-sm text-foreground bg-rose-500/10 border border-rose-500/25 p-3 rounded-xl">
                                        <span className="text-rose-500 font-bold shrink-0">⚠️</span>
                                        <span className="leading-relaxed font-medium">{kc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {decision.next_steps?.length > 0 && (
                        <div className="pt-4 border-t border-border">
                            <div className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-1.5">
                                <ListChecks className="w-4 h-4 text-primary" /> Immediate 14-Day Action Roadmap
                            </div>
                            <div className="flex flex-col gap-2.5">
                                {decision.next_steps.map((step, i) => (
                                    <div key={i} className="flex gap-3 items-start bg-card p-3 rounded-xl border border-border/80">
                                        <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5', iconBgClass, textClass)}>
                                            {i + 1}
                                        </div>
                                        <span className="text-xs md:text-sm text-foreground leading-relaxed">{step}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderSummary = () => (
        <div className="bg-card/90 dark:bg-slate-900/70 border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10"><Zap className="w-5 h-5 text-primary" aria-hidden="true" /></div>
                <div>
                    <h2 className="text-lg font-bold text-foreground">Executive Summary &amp; Thesis</h2>
                    <p className="text-xs text-muted-foreground">Synthesized across multi-agent parallel research.</p>
                </div>
            </div>

            <div className="px-6 py-5 bg-primary/[0.04] rounded-2xl border border-primary/20 border-l-4 border-l-primary shadow-sm">
                <div className="text-[11px] font-bold text-primary uppercase tracking-wider mb-2">Strategic Opportunity Thesis</div>
                <p className="text-sm md:text-base text-foreground leading-relaxed font-normal">
                    {synthesis.executive_summary_narrative || synthesis.executive_summary || synthesis.summary || 'No summary available.'}
                </p>
            </div>

            {synthesis.problem_space_narrative && (
                <div className="p-5 rounded-2xl bg-muted/40 border border-border">
                    <div className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-primary" /> Problem Space &amp; Unmet Need
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                        {synthesis.problem_space_narrative}
                    </p>
                </div>
            )}

            {synthesis.strategic_recommendation && (
                <div className="p-5 rounded-2xl bg-card border border-border">
                    <div className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-emerald-500" /> Strategic Recommendation
                    </div>
                    <p className="text-xs md:text-sm text-foreground leading-relaxed">
                        {synthesis.strategic_recommendation}
                    </p>
                </div>
            )}
        </div>
    );

    const renderMetrics = () => (
        <div className="space-y-6">
            {/* 4 Core Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Market Saturation"
                    value={competitors.saturation_score ? `${competitors.saturation_score}/10` : 'N/A'}
                    subtext={competitors.saturation_score > 7 ? 'Heavily saturated incumbents' : competitors.saturation_score > 4 ? 'Moderate rivalry, niche gaps' : 'Favorable blue ocean opportunity'}
                    icon={Target}
                    colorClass={competitors.saturation_score > 7 ? 'text-rose-500' : 'text-emerald-500'}
                />
                <StatCard
                    label="Market Growth (CAGR)"
                    value={trends.market_growth_cagr || 'N/A'}
                    subtext={trends.cagr_methodology ? 'Compound annual expansion' : 'Industry projected growth'}
                    icon={TrendingUp}
                    colorClass="text-blue-500"
                />
                <StatCard
                    label="Validation Verdict"
                    value={validation.overall_verdict || 'N/A'}
                    subtext={`${validation.validation_points?.length || 0} customer signal points recorded`}
                    icon={Users}
                    colorClass="text-emerald-500"
                />
                <StatCard
                    label="Technical Complexity"
                    value={feasibility.complexity_score ? `${feasibility.complexity_score}/10` : 'N/A'}
                    subtext={`MVP timeline: ~${feasibility.development_timeline_months || 3} months`}
                    icon={Wrench}
                    colorClass="text-amber-500"
                />
            </div>

            {/* Business Viability & Unit Economics Section */}
            <div className="bg-card/90 dark:bg-slate-900/70 border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10">
                            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-foreground">Business Viability &amp; Unit Economics</h2>
                            <p className="text-xs text-muted-foreground">Revenue engine mechanics, pricing power, and margin sustainability.</p>
                        </div>
                    </div>
                    {feasibility.monetization_model && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            {feasibility.monetization_model}
                        </span>
                    )}
                </div>

                {/* Economics Key Figures Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                    <div className="p-4 rounded-2xl bg-muted/40 border border-border">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Estimated CAC</div>
                        <div className="text-base md:text-lg font-black text-foreground">{feasibility.estimated_cac_range || 'Benchmark: $200 - $450'}</div>
                        <div className="text-xs text-muted-foreground mt-1">Blended acquisition cost</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/40 border border-border">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Estimated LTV</div>
                        <div className="text-base md:text-lg font-black text-foreground">{feasibility.estimated_ltv_range || 'Benchmark: $2,000 - $4,000'}</div>
                        <div className="text-xs text-muted-foreground mt-1">3-year horizon value</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/40 border border-border">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Target Margin</div>
                        <div className="text-base md:text-lg font-black text-emerald-600 dark:text-emerald-400">{feasibility.target_gross_margin || '75% - 85%'}</div>
                        <div className="text-xs text-muted-foreground mt-1">Gross software margin</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/40 border border-border">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">CAC Payback</div>
                        <div className="text-base md:text-lg font-black text-foreground">{feasibility.payback_period_months ? `${feasibility.payback_period_months} mo` : '8 - 12 mo'}</div>
                        <div className="text-xs text-muted-foreground mt-1">Capital recovery speed</div>
                    </div>
                </div>

                {feasibility.unit_economics_summary && (
                    <div className="p-4 rounded-2xl bg-background border border-border text-xs md:text-sm text-foreground leading-relaxed">
                        <strong className="text-foreground">Economics Synthesis: </strong>
                        {feasibility.unit_economics_summary}
                    </div>
                )}

                {feasibility.key_cost_drivers?.length > 0 && (
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Key Operating Cost Drivers</div>
                        <div className="flex flex-wrap gap-2">
                            {feasibility.key_cost_drivers.map((driver, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs bg-muted text-foreground border border-border/80 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    {driver}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderCompetitors = () => (
        <div className="bg-card/90 dark:bg-slate-900/70 border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-500/10">
                        <Target className="w-5 h-5 text-rose-500" aria-hidden="true" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-foreground">Competitive Landscape &amp; Market Gaps</h2>
                        <p className="text-xs text-muted-foreground">Incumbent analysis, structural voids, and differentiation playbooks.</p>
                    </div>
                </div>
                {competitors.saturation_score && (
                    <Badge variant={competitors.saturation_score > 7 ? 'kill' : competitors.saturation_score > 4 ? 'pivot' : 'go'} className="px-3 py-1">
                        Saturation: {competitors.saturation_score}/10
                    </Badge>
                )}
            </div>

            {competitors.market_insights && (
                <div className="p-4 rounded-2xl bg-muted/40 border border-border text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {competitors.market_insights}
                </div>
            )}

            {/* Market Gaps & Differentiation Playbook Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {competitors.market_gaps?.length > 0 && (
                    <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/25">
                        <div className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-1.5">
                            <Lightbulb className="w-4 h-4" /> Identified Structural Market Gaps
                        </div>
                        <ul className="space-y-2.5">
                            {competitors.market_gaps.map((gap, i) => (
                                <li key={i} className="text-xs md:text-sm text-foreground flex items-start gap-2.5 leading-relaxed">
                                    <span className="text-amber-500 font-bold shrink-0">•</span>
                                    <span>{gap}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {competitors.differentiation_playbook?.length > 0 && (
                    <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/25">
                        <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4" /> Defensible Differentiation Playbook
                        </div>
                        <ul className="space-y-2.5">
                            {competitors.differentiation_playbook.map((diff, i) => (
                                <li key={i} className="text-xs md:text-sm text-foreground flex items-start gap-2.5 leading-relaxed">
                                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                                    <span>{diff}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Direct Competitors Grid */}
            <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Direct Competitors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {competitors.direct_competitors?.map((comp, i) => <CompetitorCard key={i} competitor={comp} />)}
                </div>
            </div>

            {/* Indirect Competitors Grid */}
            {competitors.indirect_competitors?.length > 0 && (
                <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Indirect &amp; Legacy Alternatives</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {competitors.indirect_competitors.map((comp, i) => <CompetitorCard key={i} competitor={comp} />)}
                    </div>
                </div>
            )}
        </div>
    );

    const renderTrends = () => {
        const tamParsed = parseMetricData(trends.market_size_estimate, 'tam');
        const cagrParsed = parseMetricData(trends.market_growth_cagr, 'cagr');

        return (
            <div className="bg-card/90 dark:bg-slate-900/70 border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10">
                        <TrendingUp className="w-5 h-5 text-blue-500" aria-hidden="true" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-foreground">Market Trends &amp; Sizing Methodology</h2>
                        <p className="text-xs text-muted-foreground">Empirical TAM estimates, CAGR forecast timelines, and growth drivers.</p>
                    </div>
                </div>

                {/* Market Definition */}
                {trends.market_definition && (
                    <div className="p-4 rounded-2xl bg-muted/40 border border-border text-xs md:text-sm text-foreground flex items-start gap-2.5">
                        <span className="font-bold text-primary shrink-0">Market Category:</span>
                        <span className="text-muted-foreground leading-relaxed">{trends.market_definition}</span>
                    </div>
                )}

                {/* TAM and CAGR Breakdown Cards */}
                {(trends.market_size_estimate || trends.market_growth_cagr) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {trends.market_size_estimate && (
                            <div className="p-5 bg-sky-500/[0.04] rounded-2xl border border-sky-500/25">
                                <div className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest">Market Size (TAM)</div>
                                <div className="text-2xl md:text-3xl font-black text-foreground mt-1">{tamParsed.headline}</div>
                                {tamParsed.breakdown.length > 0 && (
                                    <div className="mt-3 pt-2.5 border-t border-sky-500/15 space-y-1.5">
                                        {tamParsed.breakdown.map((item, idx) => (
                                            <p key={idx} className="text-xs text-muted-foreground flex items-start gap-2 leading-relaxed">
                                                <span className="text-sky-500 font-bold shrink-0">•</span>
                                                <span>{item}</span>
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {trends.market_growth_cagr && (
                            <div className="p-5 bg-emerald-500/[0.04] rounded-2xl border border-emerald-500/25">
                                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Projected Growth (CAGR)</div>
                                <div className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{cagrParsed.headline}</div>
                                {trends.cagr_methodology ? (
                                    <div className="mt-3 pt-2.5 border-t border-emerald-500/15 text-xs text-muted-foreground leading-relaxed">
                                        <strong className="text-foreground">Calculation Basis: </strong>{trends.cagr_methodology}
                                    </div>
                                ) : cagrParsed.breakdown.length > 0 && (
                                    <div className="mt-3 pt-2.5 border-t border-emerald-500/15 space-y-1.5">
                                        {cagrParsed.breakdown.map((item, idx) => (
                                            <p key={idx} className="text-xs text-muted-foreground flex items-start gap-2 leading-relaxed">
                                                <span className="text-emerald-500 font-bold shrink-0">•</span>
                                                <span>{item}</span>
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Credible Market Sources */}
                {trends.market_sources?.length > 0 && (
                    <div className="p-4 rounded-2xl bg-background border border-border text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Referenced Industry Analysts &amp; Sources:</span>
                        <div className="flex flex-wrap gap-2">
                            {trends.market_sources.map((src, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted text-foreground text-xs font-medium border border-border">
                                    <Newspaper className="w-3.5 h-3.5 text-primary" /> {src}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Key Drivers */}
                {trends.key_drivers?.length > 0 && (
                    <div className="bg-primary/[0.03] rounded-2xl px-5 py-4 border border-primary/20">
                        <div className="text-[11px] font-bold text-primary uppercase tracking-widest mb-3">Key Growth Catalysts</div>
                        <div className="flex flex-col gap-2.5">
                            {trends.key_drivers.map((driver, i) => (
                                <div key={i} className="flex gap-2.5 items-start text-xs md:text-sm text-foreground">
                                    <Award className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                                    <span>{driver}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Macro Trends */}
                <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Macro Trends</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {trends.macro_trends?.map((trend, i) => <TrendCard key={i} trend={trend} />)}
                    </div>
                </div>

                {/* Micro Trends */}
                {trends.micro_trends?.length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Micro &amp; Emerging Niche Signals</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {trends.micro_trends.map((trend, i) => <TrendCard key={i} trend={trend} />)}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderValidation = () => (
        <div className="bg-card/90 dark:bg-slate-900/70 border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10">
                        <Users className="w-5 h-5 text-emerald-500" aria-hidden="true" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-foreground">Sourced Market Signals &amp; Customer Proof</h2>
                        <p className="text-xs text-muted-foreground">Verified pain points vs unproven founder hypotheses.</p>
                    </div>
                </div>
                {validation.overall_verdict && (
                    <Badge variant={validation.overall_verdict.toLowerCase().includes('strong') ? 'go' : 'pivot'} className="text-xs px-3 py-1 font-bold">
                        Demand: {validation.overall_verdict}
                    </Badge>
                )}
            </div>

            {/* Legend / Evidence notice */}
            <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-muted/40 border border-border text-xs flex-wrap">
                <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> Verified Finding: Real-world cited discussion/source
                    </span>
                    <span className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                        <HelpCircle className="w-4 h-4" /> Hypothesis: Unverified assumption requiring testing
                    </span>
                </div>
                {validation.data_source && (
                    <span className="text-xs text-muted-foreground font-medium">{validation.data_source}</span>
                )}
            </div>

            {/* Validation Points Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {validation.validation_points?.map((point, i) => <ValidationSignalCard key={i} point={point} />)}
            </div>

            {/* Practical Experiments Validation Plan */}
            {validation.validation_plan?.length > 0 && (
                <div className="p-6 rounded-2xl bg-primary/[0.03] border border-primary/25 space-y-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                            <ListChecks className="w-4 h-4" /> Practical Validation Plan (Measurable Experiments)
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">Fast field experiments before code</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        {validation.validation_plan.map((exp, i) => (
                            <div key={i} className="p-4 rounded-xl bg-background border border-border text-xs flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start gap-1 mb-2">
                                        <strong className="text-foreground text-xs md:text-sm font-bold">{exp.experiment_name}</strong>
                                        <span className="text-[11px] text-muted-foreground shrink-0 bg-muted px-2 py-0.5 rounded font-semibold">{exp.timeframe_days}d</span>
                                    </div>
                                    <p className="text-muted-foreground text-xs mb-2 leading-relaxed">
                                        <span className="text-foreground font-semibold">Channel:</span> {exp.method_or_channel}
                                    </p>
                                    <p className="text-muted-foreground text-xs mb-2 leading-relaxed">
                                        <span className="text-foreground font-semibold">Testing:</span> {exp.hypothesis_tested}
                                    </p>
                                </div>
                                <div className="pt-2.5 border-t border-border/80 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                                    Target Metric: {exp.success_criteria}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Adoption Barriers */}
            {validation.adoption_barriers?.length > 0 && (
                <div className="bg-amber-500/5 rounded-2xl px-5 py-4 border border-amber-500/25">
                    <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-2.5">Adoption &amp; Procurement Friction Points</div>
                    <div className="flex flex-col gap-2">
                        {validation.adoption_barriers.map((barrier, i) => (
                            <div key={i} className="flex gap-2.5 items-start text-xs md:text-sm text-foreground">
                                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" aria-hidden="true" />
                                <span>{barrier}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderCritic = () => (
        <div className="bg-card/90 dark:bg-slate-900/70 border border-rose-500/30 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-500/10">
                        <AlertTriangle className="w-5 h-5 text-rose-500" aria-hidden="true" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-foreground">Adversarial Teardown &amp; Fatal Flaws</h2>
                        <p className="text-xs text-muted-foreground">Rigorous stress-testing of unproven founder assumptions.</p>
                    </div>
                </div>
                {critic.survival_probability && (
                    <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                        2-Year Survival: {critic.survival_probability}%
                    </span>
                )}
            </div>

            {/* Fatal Flaws Cards */}
            <div className="space-y-3">
                {critic.fatal_flaws?.map((flaw, i) => (
                    <div key={i} className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/25 border-l-4 border-l-rose-500">
                        <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">Fatal Flaw #{i + 1}</div>
                        <p className="text-xs md:text-sm text-foreground leading-relaxed font-normal">{flaw}</p>
                    </div>
                ))}
            </div>

            {/* Brutal feedback quote */}
            {critic.harsh_feedback && (
                <div className="p-4 rounded-2xl bg-muted/60 border border-border italic text-xs md:text-sm text-foreground leading-relaxed">
                    "{critic.harsh_feedback}"
                </div>
            )}

            {/* Challenged assumptions */}
            {critic.challenged_assumptions?.length > 0 && (
                <div className="p-5 rounded-2xl bg-card border border-border">
                    <div className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2.5">Challenged Founder Assumptions</div>
                    <ul className="list-disc pl-4 space-y-2 text-xs md:text-sm text-foreground">
                        {critic.challenged_assumptions.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                </div>
            )}

            {/* Uncertainty Rationale */}
            {critic.uncertainty_rationale && (
                <div className="p-4 rounded-2xl bg-background border border-border text-xs md:text-sm text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Uncertainty &amp; Data Gaps: </strong>
                    {critic.uncertainty_rationale}
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
            <div className="space-y-6">
                <div className="bg-card/90 dark:bg-slate-900/70 border border-border rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2.5 rounded-xl bg-amber-500/10"><Lightbulb className="w-5 h-5 text-amber-500" aria-hidden="true" /></div>
                        <div>
                            <h2 className="text-base font-bold text-foreground">Alternative Strategic Wedges</h2>
                            <p className="text-xs text-muted-foreground">High-margin entry niches, counter-positioning angles, and monetization hooks.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {variations.map((variation, i) => (
                            <div key={i} className="bg-amber-500/[0.03] border border-amber-500/20 rounded-2xl p-5 flex flex-col justify-between transition-all duration-150 hover:shadow-sm">
                                <div>
                                    <div className="flex items-center gap-2 mb-2.5">
                                        <div className="w-5 h-5 rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">{i + 1}</div>
                                        <div className="text-xs md:text-sm font-bold text-foreground truncate">{variation.title || `Variation ${i + 1}`}</div>
                                    </div>
                                    <p className="text-xs md:text-[13px] text-muted-foreground leading-relaxed mb-3.5">{variation.description || variation}</p>
                                </div>
                                {(variation.target_wedge || variation.monetization) && (
                                    <div className="pt-2.5 border-t border-amber-500/20 text-xs space-y-1">
                                        {variation.target_wedge && <div><strong className="text-foreground">Initial Wedge: </strong> {variation.target_wedge}</div>}
                                        {variation.monetization && <div><strong className="text-foreground">Revenue Model: </strong> {variation.monetization}</div>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {pivots.length > 0 && (
                    <div className="bg-card/90 dark:bg-slate-900/70 border border-border rounded-3xl p-6 md:p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-primary/10"><RefreshCw className="w-4 h-4 text-primary" aria-hidden="true" /></div>
                            <h3 className="text-sm font-bold text-foreground">Contingency Pivot Vectors</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                            {pivots.map((p, idx) => (
                                <div key={idx} className="bg-muted/40 rounded-2xl p-4 border border-border">
                                    <div className="text-xs font-bold text-foreground mb-1">{typeof p === 'string' ? `Pivot ${idx + 1}` : p.title}</div>
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

    // ── Print portal for Clean, Professional PDF Export ─────────────────────
    const printContent = analysisResult && portalReady && printPortalRef.current
        ? ReactDOM.createPortal(
            <div>
                {/* Executive Report Cover Page */}
                <div className="print-cover">
                    <div>
                        <div className="print-cover-brand">CoFound.ai · Autonomous Venture Intelligence</div>
                        <h1 className="print-cover-title">
                            {structured?.core_idea || 'Startup Market Intelligence Evaluation'}
                        </h1>
                        <div className="print-cover-meta">
                            <strong>Sector:</strong> {structured?.primary_sector || 'Technology'} &nbsp;·&nbsp;
                            <strong>Target Market:</strong> {structured?.target_geography || 'Global'} &nbsp;·&nbsp;
                            <strong>Audited on:</strong> {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>

                        {/* High-level summary box on cover */}
                        <div className="print-cover-verdict-box">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '12pt', fontWeight: 900 }}>INSTITUTIONAL COMMITTEE VERDICT</span>
                                <span className={`badge-print ${decision.decision === 'GO' ? 'badge-go' : decision.decision === 'PIVOT' ? 'badge-pivot' : 'badge-kill'}`}>
                                    {decision.decision || 'PENDING'} · {decision.confidence_score}% CONFIDENCE
                                </span>
                            </div>
                            {decision.reasoning && (
                                <p style={{ fontSize: '10pt', color: '#1e293b', lineHeight: 1.5, margin: '8px 0 0' }}>
                                    {decision.reasoning}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="g4 ps" style={{ margin: 0, padding: 0, border: 'none', background: 'transparent' }}>
                            <div className="metric-card">
                                <div className="metric-label">Market Saturation</div>
                                <div className="metric-val">{competitors.saturation_score ? `${competitors.saturation_score}/10` : 'N/A'}</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-label">Projected CAGR</div>
                                <div className="metric-val">{trends.market_growth_cagr || 'N/A'}</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-label">Demand Signal</div>
                                <div className="metric-val">{validation.overall_verdict || 'N/A'}</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-label">2-Yr Survival</div>
                                <div className="metric-val">{critic.survival_probability ? `${critic.survival_probability}%` : 'N/A'}</div>
                            </div>
                        </div>

                        <div className="print-footer-bar">
                            <span>CONFIDENTIAL &amp; PROPRIETARY</span>
                            <span>Generated by CoFound.ai Multi-Agent Engine</span>
                        </div>
                    </div>
                </div>

                {/* Main Body Pages with Clean Sections & Avoided Splits */}
                <div className="print-page-wrapper">
                    
                    {/* Section 1: Executive Summary */}
                    {(synthesis.executive_summary_narrative || synthesis.executive_summary || synthesis.summary) && (
                        <div className="avoid-break">
                            <div className="section-header">1. Executive Summary &amp; Thesis</div>
                            <div className="ps">
                                <p style={{ fontSize: '10pt', lineHeight: 1.5, fontWeight: 500 }}>
                                    {synthesis.executive_summary_narrative || synthesis.executive_summary || synthesis.summary}
                                </p>
                                {synthesis.problem_space_narrative && (
                                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                                        <div style={{ fontSize: '8.5pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Target Problem Space:</div>
                                        <p style={{ marginTop: '4px' }}>{synthesis.problem_space_narrative}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Section 2: Market Definition & CAGR Methodology */}
                    <div className="avoid-break">
                        <div className="section-header">2. Market Sizing &amp; CAGR Methodology</div>
                        <div className="g2">
                            <div className="card">
                                <div className="card-title">TOTAL ADDRESSABLE MARKET (TAM)</div>
                                <div style={{ fontSize: '14pt', fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>
                                    {trends.market_size_estimate || 'Estimate pending'}
                                </div>
                                {trends.market_definition && (
                                    <p style={{ fontSize: '8.5pt', color: '#64748b' }}>
                                        <strong>Definition:</strong> {trends.market_definition}
                                    </p>
                                )}
                            </div>
                            <div className="card">
                                <div className="card-title">COMPOUND GROWTH RATE (CAGR)</div>
                                <div style={{ fontSize: '14pt', fontWeight: 900, color: '#059669', margin: '4px 0' }}>
                                    {trends.market_growth_cagr || 'Estimate pending'}
                                </div>
                                {trends.cagr_methodology && (
                                    <p style={{ fontSize: '8.5pt', color: '#64748b' }}>
                                        <strong>Methodology:</strong> {trends.cagr_methodology}
                                    </p>
                                )}
                            </div>
                        </div>
                        {trends.market_sources?.length > 0 && (
                            <div style={{ fontSize: '8.5pt', color: '#64748b', marginBottom: '12px' }}>
                                <strong>Analyst &amp; Industry Sources:</strong> {trends.market_sources.join(', ')}
                            </div>
                        )}
                    </div>

                    {/* Section 3: Business Viability & Unit Economics */}
                    <div className="avoid-break">
                        <div className="section-header">3. Business Viability &amp; Unit Economics</div>
                        <div className="g4">
                            <div className="metric-card">
                                <div className="metric-label">ESTIMATED CAC</div>
                                <div style={{ fontSize: '11pt', fontWeight: 900 }}>{feasibility.estimated_cac_range || 'Benchmark: $250'}</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-label">ESTIMATED LTV</div>
                                <div style={{ fontSize: '11pt', fontWeight: 900 }}>{feasibility.estimated_ltv_range || 'Benchmark: $2.4k'}</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-label">GROSS MARGIN</div>
                                <div style={{ fontSize: '11pt', fontWeight: 900, color: '#059669' }}>{feasibility.target_gross_margin || '75% - 85%'}</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-label">CAC PAYBACK</div>
                                <div style={{ fontSize: '11pt', fontWeight: 900 }}>{feasibility.payback_period_months ? `${feasibility.payback_period_months} mo` : '8-12 mo'}</div>
                            </div>
                        </div>
                        {feasibility.unit_economics_summary && (
                            <div className="ps" style={{ background: '#f8fafc' }}>
                                <p><strong>Viability Summary:</strong> {feasibility.unit_economics_summary}</p>
                            </div>
                        )}
                    </div>

                    {/* Section 4: Sourced Market Signals & Customer Pain Points */}
                    {validation.validation_points?.length > 0 && (
                        <div className="page-break">
                            <div className="section-header">4. Sourced Market Signals &amp; Customer Proof</div>
                            <p style={{ fontSize: '8.5pt', color: '#64748b', marginBottom: '8px' }}>
                                Verified findings from real-world search and user discussions vs. unproven founder hypotheses:
                            </p>
                            <div className="g2">
                                {validation.validation_points.map((pt, i) => {
                                    const isVerified = pt.evidence_type === 'verified_finding' || (pt.sources && pt.sources.length > 0);
                                    return (
                                        <div key={i} className="card">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <div className="card-title">{pt.user_segment}</div>
                                                <span className={`badge-print ${isVerified ? 'badge-verified' : 'badge-hypo'}`}>
                                                    {isVerified ? 'Verified Finding' : 'Hypothesis'}
                                                </span>
                                            </div>
                                            <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>{pt.pain_point}</p>
                                            {pt.quote && <p style={{ fontStyle: 'italic', color: '#475569', marginBottom: '6px' }}>"{pt.quote}"</p>}
                                            {pt.sources?.length > 0 && (
                                                <div style={{ fontSize: '8pt', color: '#2563eb', marginBottom: '6px' }}>
                                                    {pt.sources.map((s, idx) => (
                                                        <div key={idx}>🔗 {s.headline || s.url} ({s.url})</div>
                                                    ))}
                                                </div>
                                            )}
                                            <div style={{ fontSize: '8pt', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
                                                Pain Severity: <strong>{pt.severity}/10</strong> &nbsp;·&nbsp; WTP: <strong>{pt.willingness_to_pay}</strong>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Practical Validation Plan */}
                            {validation.validation_plan?.length > 0 && (
                                <div className="avoid-break" style={{ marginTop: '12px' }}>
                                    <div style={{ fontSize: '9pt', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', marginBottom: '6px' }}>
                                        Practical Validation Experiments (Actionable Test Protocol)
                                    </div>
                                    <div className="g3">
                                        {validation.validation_plan.map((exp, i) => (
                                            <div key={i} className="card" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
                                                <div style={{ fontWeight: 800, fontSize: '9pt', color: '#0369a1' }}>{exp.experiment_name}</div>
                                                <div style={{ fontSize: '8pt', color: '#475569', marginTop: '2px' }}>Method: {exp.method_or_channel}</div>
                                                <div style={{ fontSize: '8pt', color: '#0284c7', fontWeight: 700, marginTop: '4px' }}>
                                                    Target Success: {exp.success_criteria}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Section 5: Competitor Landscape & Market Gaps */}
                    {competitors.direct_competitors?.length > 0 && (
                        <div className="page-break">
                            <div className="section-header">5. Competitor Landscape &amp; Market Gaps</div>
                            
                            {/* Identified Gaps & Differentiation Vectors */}
                            {(competitors.market_gaps?.length > 0 || competitors.differentiation_playbook?.length > 0) && (
                                <div className="g2 avoid-break" style={{ marginBottom: '14px' }}>
                                    {competitors.market_gaps?.length > 0 && (
                                        <div className="card" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
                                            <div style={{ fontSize: '9pt', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', marginBottom: '4px' }}>Identified Market Gaps</div>
                                            <ul style={{ margin: 0, paddingLeft: '14px' }}>
                                                {competitors.market_gaps.map((g, idx) => <li key={idx} style={{ fontSize: '8.5pt', color: '#78350f' }}>{g}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {competitors.differentiation_playbook?.length > 0 && (
                                        <div className="card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                                            <div style={{ fontSize: '9pt', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', marginBottom: '4px' }}>Differentiation Playbook</div>
                                            <ul style={{ margin: 0, paddingLeft: '14px' }}>
                                                {competitors.differentiation_playbook.map((d, idx) => <li key={idx} style={{ fontSize: '8.5pt', color: '#14532d' }}>{d}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="g2">
                                {[...(competitors.direct_competitors || []), ...(competitors.indirect_competitors || [])].map((c, i) => (
                                    <div key={i} className="card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div className="card-title">{c.name}</div>
                                            {c.funding && <span className="badge-print badge-go">{c.funding}</span>}
                                        </div>
                                        {c.website && <div style={{ fontSize: '8pt', color: '#2563eb', marginBottom: '4px' }}>{c.website}</div>}
                                        <p style={{ marginTop: '2px', marginBottom: '6px' }}>{c.description}</p>
                                        {c.differentiation_angle && (
                                            <div style={{ fontSize: '8pt', color: '#0284c7', background: '#f0f9ff', padding: '3px 6px', borderRadius: '4px' }}>
                                                <strong>Angle:</strong> {c.differentiation_angle}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section 6: Adversarial Critic & Kill Conditions */}
                    {critic.fatal_flaws?.length > 0 && (
                        <div className="avoid-break">
                            <div className="section-header">6. Adversarial Critic &amp; Risk Teardown</div>
                            <div className="ps" style={{ border: '1px solid #fecaca', background: '#fff1f2' }}>
                                <div style={{ fontSize: '9pt', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase', marginBottom: '6px' }}>
                                    Fatal Flaws &amp; Structural Blockers
                                </div>
                                {critic.fatal_flaws.map((flaw, i) => (
                                    <div key={i} style={{ borderLeft: '3px solid #ef4444', paddingLeft: '10px', marginBottom: '8px' }}>
                                        <p style={{ color: '#7f1d1d', fontWeight: 600 }}>{flaw}</p>
                                    </div>
                                ))}
                                {critic.uncertainty_rationale && (
                                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #fecaca', fontSize: '8.5pt', color: '#991b1b' }}>
                                        <strong>Uncertainty Analysis:</strong> {critic.uncertainty_rationale}
                                    </div>
                                )}
                            </div>

                            {decision.kill_conditions?.length > 0 && (
                                <div className="card" style={{ background: '#fef2f2', borderColor: '#fecaca', marginTop: '8px' }}>
                                    <div style={{ fontSize: '9pt', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', marginBottom: '4px' }}>
                                        Kill Conditions (When to Halt)
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '14px' }}>
                                        {decision.kill_conditions.map((kc, idx) => (
                                            <li key={idx} style={{ fontSize: '8.5pt', color: '#7f1d1d' }}>{kc}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Section 7: Immediate Action Roadmap */}
                    {decision.next_steps?.length > 0 && (
                        <div className="avoid-break">
                            <div className="section-header">7. Immediate 14-Day Action Roadmap</div>
                            <div className="ps">
                                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                                    {decision.next_steps.map((s, i) => (
                                        <li key={i} style={{ fontWeight: 600, color: '#0f172a' }}>{s}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>,
            printPortalRef.current
        ) : null;

    // ── Main Screen Render ──────────────────────────────────────────────────
    return (
        <>
            {printContent}
            <div className="min-h-screen bg-background">

                {/* Natural-scrolling Hero Header: Large title and actions scroll away naturally */}
                <header className="border-b border-border bg-card/60 backdrop-blur-xs">
                    <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 pb-5">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
                            <span>Intelligence Reports</span>
                            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                            <span className="font-semibold text-foreground">Multi-Agent Swarm Audit</span>
                        </div>
                        
                        <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
                            <div className="flex-1 min-w-[280px]">
                                <h1 className="text-xl md:text-3xl font-black text-foreground tracking-tight leading-snug">
                                    {structured.core_idea || 'Market Intelligence Report'}
                                </h1>
                                <div className="flex items-center gap-2.5 mt-3 flex-wrap text-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-lg font-semibold text-foreground border border-border/60">
                                        <Building className="w-3.5 h-3.5 text-primary" /> {structured.primary_sector || 'Emerging Market'}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-lg font-semibold text-foreground border border-border/60">
                                        <MapPin className="w-3.5 h-3.5 text-primary" /> {structured.target_geography || 'Global'}
                                    </span>
                                    <span className="text-muted-foreground font-medium">
                                        Audited {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                            
                            <ReportHeaderActions analysisResult={analysisResult} handleExportPDF={handleExportPDF} />
                        </div>
                    </div>
                </header>

                {/* Sticky Section Navigation: Compact slim bar that stays at top while scrolling content */}
                <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border shadow-xs">
                    <div className="max-w-6xl mx-auto px-4 md:px-8 py-2 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <SectionNav sections={availableSections} activeSection={activeSection?.id} onChange={goTo} />
                        </div>
                        <div className="shrink-0 hidden md:flex items-center gap-2 text-xs text-muted-foreground font-semibold pl-2 border-l border-border">
                            <span>{activeSectionIdx + 1} of {availableSections.length}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Area - Window scrolls naturally without trapped inner containers */}
                <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
                    {activeSection && (
                        <div className="animate-fade-in-up">
                            {renderSection(activeSection.id)}
                        </div>
                    )}

                    {/* Bottom Navigation Controls */}
                    <div className="mt-12 pt-6 border-t border-border flex items-center justify-between gap-4">
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={() => canPrev && scrollToSection(activeSectionIdx - 1)}
                            disabled={!canPrev}
                            className="gap-2 font-bold text-xs"
                        >
                            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                            {canPrev ? `Previous: ${availableSections[activeSectionIdx - 1].label}` : 'Start'}
                        </Button>

                        <div className="flex flex-col items-center gap-1.5">
                            <span className="text-xs text-muted-foreground font-semibold">
                                Section {activeSectionIdx + 1} of {availableSections.length}
                            </span>
                            <div className="flex gap-1.5" role="tablist" aria-label="Section dots">
                                {availableSections.map((sec, i) => (
                                    <button
                                        key={i}
                                        role="tab"
                                        aria-selected={i === activeSectionIdx}
                                        aria-label={`Go to ${sec.label}`}
                                        onClick={() => scrollToSection(i)}
                                        className={cn(
                                            'h-2 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                                            i === activeSectionIdx ? 'w-6 bg-primary' : 'w-2 bg-muted hover:bg-muted-foreground'
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        <Button
                            variant="secondary"
                            size="md"
                            onClick={() => canNext && scrollToSection(activeSectionIdx + 1)}
                            disabled={!canNext}
                            className="gap-2 font-bold text-xs"
                        >
                            {canNext ? `Next: ${availableSections[activeSectionIdx + 1].label}` : 'Report Complete'}
                            <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </Button>
                    </div>
                </main>
            </div>
        </>
    );
}
