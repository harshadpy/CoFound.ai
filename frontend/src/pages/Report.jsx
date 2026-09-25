import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import {
    Share2, ChevronRight, TrendingUp, Users,
    Target, AlertTriangle, CheckCircle, Lightbulb, Wrench,
    Calendar, Award, XCircle, ExternalLink, Newspaper, Info,
    ArrowLeft, ArrowRight, Printer, Zap, BarChart2, Clock,
    Bookmark, BookmarkCheck, Check, Link
} from 'lucide-react';

// --- Section registry ---
const SECTIONS = [
    { id: 'decision',    label: 'Decision',         color: '#6366f1' },
    { id: 'summary',     label: 'Executive Summary', color: '#0ea5e9' },
    { id: 'metrics',     label: 'Key Metrics',       color: '#10b981' },
    { id: 'competitors', label: 'Competitors',        color: '#f43f5e' },
    { id: 'trends',      label: 'Trends',             color: '#3b82f6' },
    { id: 'validation',  label: 'Market Signals',     color: '#22c55e' },
    { id: 'critic',      label: 'Critical Analysis',  color: '#ef4444' },
    { id: 'ideation',    label: 'Alternatives',       color: '#f59e0b' },
];

// --- Helper: initials avatar for competitors ---
const Avatar = ({ name, size = 36 }) => {
    const initials = name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';
    const colors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#f43f5e','#8b5cf6','#14b8a6'];
    const color = colors[name ? name.charCodeAt(0) % colors.length : 0];
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            background: `${color}20`, border: `2px solid ${color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color, fontWeight: 700, fontSize: size * 0.35, flexShrink: 0
        }}>
            {initials}
        </div>
    );
};

// --- Stat Card ---
const StatCard = ({ label, value, subtext, icon: Icon, color, gradient }) => (
    <div style={{
        background: gradient || `linear-gradient(135deg, white, ${color}08)`,
        borderRadius: 16, border: `1px solid ${color}25`,
        padding: '20px 22px', position: 'relative', overflow: 'hidden',
        transition: 'all 0.2s', cursor: 'default'
    }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}20`; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
        <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.06 }}>
            <Icon style={{ width: 80, height: 80, color }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ padding: '6px', borderRadius: 8, background: `${color}15`, color, display: 'flex' }}>
                <Icon style={{ width: 14, height: 14 }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 4 }}>{value}</div>
        <div style={{ fontSize: 12, color: '#64748b' }}>{subtext}</div>
    </div>
);

// --- Competitor Card ---
const CompetitorCard = ({ competitor }) => (
    <div style={{
        background: 'white', borderRadius: 14, border: '1px solid #e2e8f0',
        padding: '18px 20px', transition: 'all 0.2s'
    }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.boxShadow = '0 4px 16px #3b82f615'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = ''; }}
    >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
            <Avatar name={competitor.name} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{competitor.name}</span>
                    {competitor.funding && (
                        <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                            background: '#d1fae5', color: '#065f46'
                        }}>{competitor.funding}</span>
                    )}
                </div>
                {competitor.website && (
                    <a href={competitor.website} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                        {competitor.website} <ExternalLink style={{ width: 10, height: 10 }} />
                    </a>
                )}
            </div>
        </div>
        <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, marginBottom: 10 }}>{competitor.description}</p>
        {competitor.team_size && (
            <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                <Users style={{ width: 11, height: 11 }} /> Team: {competitor.team_size}
            </div>
        )}
        {competitor.strengths?.length > 0 && (
            <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Strengths</div>
                {competitor.strengths.slice(0, 2).map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 2 }}>
                        <CheckCircle style={{ width: 11, height: 11, color: '#10b981', marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: '#374151' }}>{s}</span>
                    </div>
                ))}
            </div>
        )}
        {competitor.weaknesses?.length > 0 && (
            <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Gaps</div>
                {competitor.weaknesses.slice(0, 2).map((w, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 2 }}>
                        <XCircle style={{ width: 11, height: 11, color: '#ef4444', marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: '#374151' }}>{w}</span>
                    </div>
                ))}
            </div>
        )}
    </div>
);

// --- Trend Card ---
const TrendCard = ({ trend }) => (
    <div style={{
        background: 'linear-gradient(135deg, #ffffff, #eff6ff50)',
        borderRadius: 14, border: '1px solid #bfdbfe',
        padding: '16px 18px', transition: 'all 0.2s'
    }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px #3b82f615'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>{trend.trend}</h4>
            {trend.relevance_score && (
                <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#dbeafe', color: '#1d4ed8', flexShrink: 0, marginLeft: 8 }}>
                    {trend.relevance_score}/10
                </span>
            )}
        </div>
        {trend.description && <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, marginBottom: 8 }}>{trend.description}</p>}
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8' }}>
            {trend.timeframe && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock style={{ width: 10, height: 10 }} />{trend.timeframe}
                </span>
            )}
        </div>
        {trend.impact && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #e0f2fe', fontSize: 11, color: '#0369a1' }}>
                <strong>Impact:</strong> {trend.impact}
            </div>
        )}
        {trend.sources?.length > 0 && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems:'center', gap:3, marginBottom: 4 }}>
                    <Newspaper style={{ width: 10, height: 10 }} /> SOURCES
                </div>
                {trend.sources.map((src, i) => (
                    <a key={i} href={src.url} target="_blank" rel="noopener noreferrer"
                        style={{ display:'block', fontSize: 11, color: '#3b82f6', marginBottom: 2 }}>
                        {src.headline || src.url}
                    </a>
                ))}
            </div>
        )}
    </div>
);

// --- Validation Signal Card ---
const ValidationSignalCard = ({ point }) => {
    const sentBg = point.sentiment === 'positive' ? '#d1fae5' : point.sentiment === 'negative' ? '#fee2e2' : '#f1f5f9';
    const sentColor = point.sentiment === 'positive' ? '#065f46' : point.sentiment === 'negative' ? '#991b1b' : '#475569';
    const wtpColor = point.willingness_to_pay === 'High' ? { bg: '#d1fae5', text: '#065f46' }
        : point.willingness_to_pay === 'Medium' ? { bg: '#fef9c3', text: '#92400e' }
        : { bg: '#f1f5f9', text: '#475569' };
    return (
        <div style={{
            background: 'white', borderRadius: 14, border: '1px solid #e2e8f0',
            padding: '16px 18px', transition: 'all 0.2s'
        }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 12px #00000010'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{point.user_segment}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: sentBg, color: sentColor, textTransform: 'uppercase' }}>
                    {point.sentiment}
                </span>
            </div>
            <p style={{ fontSize: 12, color: '#374151', fontWeight: 500, lineHeight: 1.6, marginBottom: 8 }}>{point.pain_point}</p>
            {point.sources?.length > 0 ? (
                <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>REFERENCED HEADLINES</div>
                    {point.sources.map((src, i) => (
                        <a key={i} href={src.url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'block', fontSize: 11, color: '#3b82f6' }}>
                            {src.headline || src.url}
                        </a>
                    ))}
                </div>
            ) : (
                <div style={{ display: 'flex', gap: 6, background: '#f8fafc', borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>
                    <Info style={{ width: 12, height: 12, color: '#94a3b8', flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 11, color: '#64748b', margin: 0, fontStyle: 'italic' }}>
                        AI-inferred signal based on market pattern analysis. Validate with primary research.
                    </p>
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 11 }}>
                    <span style={{ color: '#94a3b8' }}>Pain Severity: </span>
                    <span style={{ color: '#0f172a', fontWeight: 700 }}>{point.severity}/10</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: wtpColor.bg, color: wtpColor.text }}>
                    WTP: {point.willingness_to_pay}
                </span>
            </div>
        </div>
    );
};

// --- Section Nav ---
const SectionNav = ({ sections, activeSection, onChange }) => (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {sections.map((sec) => (
            <button
                key={sec.id}
                onClick={() => onChange(sec.id)}
                style={{
                    padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                    whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    background: activeSection === sec.id ? sec.color || '#1e293b' : '#f1f5f9',
                    color: activeSection === sec.id ? 'white' : '#64748b',
                    boxShadow: activeSection === sec.id ? `0 2px 8px ${sec.color}40` : 'none',
                    transform: activeSection === sec.id ? 'scale(1.02)' : 'scale(1)',
                }}
            >
                {sec.label}
            </button>
        ))}
    </div>
);

// --- Report Header Actions: Share + Save + Export PDF ---
const ReportHeaderActions = ({ analysisResult, handleExportPDF }) => {
    const { saveInsight } = useStore();
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const url = window.location.href;
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(url);
            } else {
                // Fallback for older browsers
                const el = document.createElement('textarea');
                el.value = url;
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSave = () => {
        if (!analysisResult) return;
        const structured = analysisResult?.structured_data;
        const decision = structured?.decision_results;
        const coreIdea = structured?.thought_structuring?.core_idea
            || structured?.synthesis_results?.executive_summary?.slice(0, 60)
            || 'Market Analysis';
        const ok = saveInsight({
            id: Date.now().toString(),
            type: 'report',
            title: `Report: ${coreIdea}`,
            query: coreIdea,
            data: analysisResult,
            savedAt: Date.now()
        });
        if (ok !== false) setSaved(true);
    };

    const btnBase = {
        padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
    };

    return (
        <div style={{ display: 'flex', gap: 8 }}>
            {/* Share — copies link */}
            <button
                onClick={handleShare}
                style={{
                    ...btnBase,
                    border: `1px solid ${copied ? '#86efac' : '#e2e8f0'}`,
                    background: copied ? '#f0fdf4' : 'white',
                    color: copied ? '#16a34a' : '#475569',
                }}
                onMouseEnter={e => { if (!copied) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (!copied) e.currentTarget.style.background = 'white'; }}
                title="Copy link to clipboard"
            >
                {copied
                    ? <><Check style={{ width: 14, height: 14 }} /> Copied!</>
                    : <><Share2 style={{ width: 14, height: 14 }} /> Share</>
                }
            </button>

            {/* Save to Insights */}
            <button
                onClick={handleSave}
                disabled={saved}
                style={{
                    ...btnBase,
                    border: `1px solid ${saved ? '#86efac' : '#e2e8f0'}`,
                    background: saved ? '#f0fdf4' : 'white',
                    color: saved ? '#16a34a' : '#475569',
                    cursor: saved ? 'default' : 'pointer',
                }}
                onMouseEnter={e => { if (!saved) e.currentTarget.style.background = '#f0fdf4'; }}
                onMouseLeave={e => { if (!saved) e.currentTarget.style.background = 'white'; }}
                title="Save to Saved Insights"
            >
                {saved
                    ? <><BookmarkCheck style={{ width: 14, height: 14 }} /> Saved!</>
                    : <><Bookmark style={{ width: 14, height: 14 }} /> Save</>
                }
            </button>

            {/* Export PDF */}
            <button
                onClick={handleExportPDF}
                style={{
                    ...btnBase,
                    border: 'none',
                    background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                    color: 'white',
                    boxShadow: '0 4px 12px #0f172a30',
                    fontWeight: 700,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px #0f172a40'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 12px #0f172a30'; }}
            >
                <Printer style={{ width: 14, height: 14 }} /> Export PDF
            </button>
        </div>
    );
};

// ============================================================
// Main Report Component
// ============================================================
export default function Report() {
    const { analysisResult } = useStore();
    const navigate = useNavigate();
    const [activeSectionIdx, setActiveSectionIdx] = useState(0);
    const [portalReady, setPortalReady] = useState(false);
    const contentRef = useRef(null);
    const printPortalRef = useRef(null);

    useEffect(() => {
        if (!analysisResult) navigate('/');
    }, [analysisResult, navigate]);

    // Create body-level portal container outside #root
    useEffect(() => {
        const container = document.createElement('div');
        container.id = 'report-print-portal';
        document.body.appendChild(container);
        printPortalRef.current = container;
        setPortalReady(true);
        return () => {
            if (document.body.contains(container)) document.body.removeChild(container);
        };
    }, []);

    // Print styles — hide #root, show portal
    useEffect(() => {
        const style = document.createElement('style');
        style.id = 'report-print-styles';
        style.textContent = `
            @media print {
                #root { display: none !important; }
                #report-print-portal { display: block !important; }
                
                /* Setting margin to 0 hides the browser's default header/footer (timestamp, URL, page X of Y) */
                @page { margin: 0; size: auto; }
                
                /* Ensure background colors and graphics are printed */
                body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0; padding: 0; background: white; }
                
                #report-print-portal { font-family: Inter, system-ui, sans-serif; color: #0f172a; background: white; width: 100%; box-sizing: border-box; }
                
                .print-page-wrapper { padding: 20mm; box-sizing: border-box; }
                
                /* Cover Page */
                .print-cover { height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: 20mm; page-break-after: always; background: linear-gradient(135deg, #f8fafc, #f1f5f9); }
                .print-cover-brand { font-size: 14px; font-weight: 800; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px; }
                .print-cover h1 { font-size: 48px; font-weight: 900; color: #0f172a; margin: 0 0 16px; letter-spacing: -0.02em; line-height: 1.1; }
                .print-cover-meta { font-size: 16px; color: #64748b; font-weight: 500; }
                
                /* General Print Scaffolding */
                .ps { page-break-inside: avoid; margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
                .ps-title { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin: 0 0 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
                #report-print-portal p, #report-print-portal li { font-size: 13px; color: #334155; line-height: 1.6; margin: 0; }
                
                .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .g4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
                
                /* Cards */
                .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; background: #f8fafc; }
                .card-title { font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
                .metric-card { background: linear-gradient(135deg, #ffffff, #f8fafc); border-radius: 10px; border: 1px solid #e2e8f0; padding: 16px; text-align: center; }
                .metric-label { font-size: 10px; font-weight: 800; color: #64748b; letter-spacing: 0.05em; margin-bottom: 6px; }
                .metric-val { font-size: 24px; font-weight: 900; color: #0f172a; margin: 0; }
                
                /* Badges & Accents */
                .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; margin-bottom: 12px; }
                .go { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
                .nogo { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
                .pivot { background: #fef9c3; color: #92400e; border: 1px solid #fde68a; }
                
                .str { color: #059669; font-size: 12px; margin-top: 4px; font-weight: 500; }
                .gap { color: #dc2626; font-size: 12px; margin-top: 4px; font-weight: 500; }
                
                ul { padding-left: 20px; margin-top: 8px; }
                li { margin-bottom: 6px; }
                
                /* Headers */
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

    const handleExportPDF = useCallback(() => { window.print(); }, []);

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

    const availableSections = SECTIONS.filter((sec) => {
        if (sec.id === 'decision')    return !!decision.decision;
        if (sec.id === 'summary')     return !!(synthesis.executive_summary_narrative || synthesis.executive_summary || synthesis.summary);
        if (sec.id === 'metrics')     return true;
        if (sec.id === 'competitors') return competitors.direct_competitors?.length > 0;
        if (sec.id === 'trends')      return trends.macro_trends?.length > 0;
        if (sec.id === 'validation')  return validation.validation_points?.length > 0;
        if (sec.id === 'critic')      return critic.fatal_flaws?.length > 0;
        if (sec.id === 'ideation')    return ideation.variations?.length > 0;
        return true;
    });

    const activeSection = availableSections[activeSectionIdx];
    const canPrev = activeSectionIdx > 0;
    const canNext = activeSectionIdx < availableSections.length - 1;
    const goTo = (id) => {
        const idx = availableSections.findIndex(s => s.id === id);
        if (idx !== -1) setActiveSectionIdx(idx);
    };

    // ---- Section renderers ----

    const renderDecision = () => {
        const isGO    = decision.decision === 'GO';
        const isPIVOT = decision.decision === 'PIVOT';
        const gradient = isGO
            ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)'
            : isPIVOT ? 'linear-gradient(135deg, #fefce8, #fef9c3)'
            : 'linear-gradient(135deg, #fff1f2, #fee2e2)';
        const border = isGO ? '#86efac' : isPIVOT ? '#fde047' : '#fca5a5';
        const accent = isGO ? '#16a34a' : isPIVOT ? '#ca8a04' : '#dc2626';
        const Icon = isGO ? CheckCircle : isPIVOT ? AlertTriangle : XCircle;
        return (
            <div style={{ background: gradient, borderRadius: 20, border: `2px solid ${border}`, padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <div style={{ padding: 12, borderRadius: 14, background: `${accent}20` }}>
                        <Icon style={{ width: 32, height: 32, color: accent }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                            Decision: <span style={{ color: accent }}>{decision.decision}</span>
                        </div>
                        {decision.confidence_score && (
                            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                                Confidence Score: <strong style={{ color: accent }}>{decision.confidence_score}%</strong>
                                <span style={{ marginLeft: 12, display: 'inline-block', height: 6, width: 120, borderRadius: 999, background: '#e2e8f0', position: 'relative', verticalAlign: 'middle' }}>
                                    <span style={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 999, background: accent, width: `${decision.confidence_score}%` }} />
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                {decision.reasoning && (
                    <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, marginBottom: 20 }}>{decision.reasoning}</p>
                )}
                {decision.next_steps?.length > 0 && (
                    <div style={{ background: 'white', borderRadius: 12, padding: '18px 20px', border: `1px solid ${border}` }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                            Next Steps
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {decision.next_steps.map((step, i) => (
                                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${accent}20`, color: accent, fontSize: 10, fontWeight: 800, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {i + 1}
                                    </div>
                                    <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderSummary = () => (
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 4px 20px #0000000a' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ padding: 8, borderRadius: 10, background: '#eff6ff' }}>
                    <Zap style={{ width: 18, height: 18, color: '#2563eb' }} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Executive Summary</h2>
            </div>
            <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', borderRadius: 12, border: '1px solid #bae6fd', borderLeft: '4px solid #0ea5e9' }}>
                <p style={{ fontSize: 14, color: '#0c4a6e', lineHeight: 1.8, margin: 0 }}>
                    {synthesis.executive_summary_narrative || synthesis.executive_summary || synthesis.summary || 'No summary available.'}
                </p>
            </div>
        </div>
    );

    const renderMetrics = () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <StatCard label="Market Saturation" value={competitors.saturation_score ? `${competitors.saturation_score}/10` : 'N/A'} subtext="Competition level" icon={Target} color="#f43f5e" gradient="linear-gradient(135deg, #fff1f2, #ffe4e6)" />
            <StatCard label="Market Growth" value={trends.market_growth_cagr || 'N/A'} subtext="Projected CAGR" icon={TrendingUp} color="#3b82f6" gradient="linear-gradient(135deg, #eff6ff, #dbeafe)" />
            <StatCard label="Validation" value={validation.overall_verdict || 'N/A'} subtext="User demand signal" icon={Users} color="#10b981" gradient="linear-gradient(135deg, #f0fdf4, #dcfce7)" />
            <StatCard label="Feasibility" value={feasibility.complexity_score ? `${feasibility.complexity_score}/10` : 'N/A'} subtext="Build complexity" icon={Wrench} color="#f59e0b" gradient="linear-gradient(135deg, #fffbeb, #fef9c3)" />
        </div>
    );

    const renderCompetitors = () => (
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 4px 20px #0000000a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ padding: 8, borderRadius: 10, background: '#fff1f2' }}>
                    <Target style={{ width: 18, height: 18, color: '#f43f5e' }} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Competitor Landscape</h2>
                {competitors.saturation_score && (
                    <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: competitors.saturation_score > 7 ? '#fee2e2' : competitors.saturation_score > 4 ? '#fef9c3' : '#d1fae5', color: competitors.saturation_score > 7 ? '#991b1b' : competitors.saturation_score > 4 ? '#92400e' : '#065f46' }}>
                        Saturation: {competitors.saturation_score}/10
                    </span>
                )}
            </div>
            {competitors.market_insights && (
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>{competitors.market_insights}</p>
            )}
            <div>
                <h3 style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Direct Competitors</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 20 }}>
                    {competitors.direct_competitors?.map((comp, i) => <CompetitorCard key={i} competitor={comp} />)}
                </div>
            </div>
            {competitors.indirect_competitors?.length > 0 && (
                <div>
                    <h3 style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Indirect Competitors</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                        {competitors.indirect_competitors.map((comp, i) => <CompetitorCard key={i} competitor={comp} />)}
                    </div>
                </div>
            )}
        </div>
    );

    const renderTrends = () => (
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 4px 20px #0000000a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ padding: 8, borderRadius: 10, background: '#eff6ff' }}>
                    <TrendingUp style={{ width: 18, height: 18, color: '#3b82f6' }} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Market Trends &amp; Growth</h2>
            </div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
                {trends.market_size_estimate && (
                    <div style={{ padding: '12px 18px', background: '#f0f9ff', borderRadius: 12, border: '1px solid #bae6fd' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Market Size</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#0c4a6e', marginTop: 2 }}>{trends.market_size_estimate}</div>
                    </div>
                )}
                {trends.market_growth_cagr && (
                    <div style={{ padding: '12px 18px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #86efac' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>CAGR</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#14532d', marginTop: 2 }}>{trends.market_growth_cagr}</div>
                    </div>
                )}
            </div>
            {trends.key_drivers?.length > 0 && (
                <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: 12, padding: '16px 18px', marginBottom: 20, border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Key Growth Drivers</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {trends.key_drivers.map((driver, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <Award style={{ width: 13, height: 13, color: '#2563eb', marginTop: 2, flexShrink: 0 }} />
                                <span style={{ fontSize: 13, color: '#1e40af' }}>{driver}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Macro Trends</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                    {trends.macro_trends?.map((trend, i) => <TrendCard key={i} trend={trend} />)}
                </div>
            </div>
            {trends.micro_trends?.length > 0 && (
                <div>
                    <h3 style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Micro Trends</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                        {trends.micro_trends.map((trend, i) => <TrendCard key={i} trend={trend} />)}
                    </div>
                </div>
            )}
        </div>
    );

    const renderValidation = () => (
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 4px 20px #0000000a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ padding: 8, borderRadius: 10, background: '#f0fdf4' }}>
                    <Users style={{ width: 18, height: 18, color: '#22c55e' }} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Market Signals</h2>
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 16px', marginBottom: 20, display: 'flex', gap: 10 }}>
                <AlertTriangle style={{ width: 16, height: 16, color: '#d97706', flexShrink: 0, marginTop: 1 }} />
                <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#92400e', margin: '0 0 2px' }}>AI-Inferred Market Signals &mdash; Not Real User Quotes</p>
                    <p style={{ fontSize: 11, color: '#a16207', margin: 0 }}>
                        Pain points and WTP estimates are derived from public market data and AI pattern inference. Conduct primary research before investment decisions.
                    </p>
                </div>
            </div>
            {validation.overall_verdict && (
                <div style={{ marginBottom: 20 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, padding: '6px 16px', borderRadius: 999, background: '#f1f5f9', color: '#374151', border: '1px solid #e2e8f0' }}>
                        Overall: {validation.overall_verdict}
                    </span>
                </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 20 }}>
                {validation.validation_points?.map((point, i) => <ValidationSignalCard key={i} point={point} />)}
            </div>
            {validation.adoption_barriers?.length > 0 && (
                <div style={{ background: '#fffbeb', borderRadius: 12, padding: '16px 18px', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Adoption Barriers</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {validation.adoption_barriers.map((barrier, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <AlertTriangle style={{ width: 13, height: 13, color: '#d97706', marginTop: 2, flexShrink: 0 }} />
                                <span style={{ fontSize: 13, color: '#78350f' }}>{barrier}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderCritic = () => (
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #fecaca', padding: '32px', boxShadow: '0 4px 20px #ef444408' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ padding: 8, borderRadius: 10, background: '#fff1f2' }}>
                    <AlertTriangle style={{ width: 18, height: 18, color: '#ef4444' }} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Critical Analysis</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {critic.fatal_flaws?.map((flaw, i) => (
                    <div key={i} style={{ padding: '16px 18px', background: 'linear-gradient(135deg, #fff1f2, #fee2e2)', borderRadius: 12, borderLeft: '4px solid #ef4444' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#dc2626', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Fatal Flaw #{i + 1}
                        </div>
                        <p style={{ fontSize: 13, color: '#7f1d1d', lineHeight: 1.6, margin: 0 }}>{flaw}</p>
                    </div>
                ))}
            </div>
            {critic.survival_probability && (
                <div style={{ marginTop: 20, padding: '14px 18px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>Survival Probability: </span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{critic.survival_probability}</span>
                </div>
            )}
        </div>
    );

    const renderIdeation = () => (
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 4px 20px #0000000a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ padding: 8, borderRadius: 10, background: '#fffbeb' }}>
                    <Lightbulb style={{ width: 18, height: 18, color: '#f59e0b' }} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Alternative Approaches</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {ideation.variations?.map((variation, i) => (
                    <div key={i} style={{
                        padding: '18px 20px', borderRadius: 14,
                        background: `linear-gradient(135deg, ${['#fff7ed','#fffbeb','#fefce8','#fef9c3'][i % 4]}, white)`,
                        border: '1px solid #fde68a', transition: 'all 0.2s'
                    }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px #f59e0b20'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#fef9c3', border: '2px solid #fde68a', fontSize: 11, fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {i + 1}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{variation.title || `Variation ${i + 1}`}</div>
                        </div>
                        <p style={{ fontSize: 12, color: '#78350f', lineHeight: 1.6, margin: 0 }}>{variation.description || variation}</p>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderSection = (id) => {
        switch (id) {
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

    // ---- Print portal content ----
    const printContent = analysisResult && portalReady && printPortalRef.current
        ? ReactDOM.createPortal(
            <div style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: '0', color: '#0f172a', background: 'white' }}>
                <div className="print-cover">
                    <div className="print-cover-brand">CoFound.ai</div>
                    <h1>Market Intelligence<br/>Report</h1>
                    <div className="print-cover-meta">Generated on {new Date().toLocaleDateString()}</div>
                </div>

                <div className="print-page-wrapper">
                    {decision.decision && (
                        <div className="ps" style={{ borderLeft: decision.decision === 'GO' ? '4px solid #10b981' : decision.decision === 'PIVOT' ? '4px solid #f59e0b' : '4px solid #ef4444' }}>
                            <div className="ps-title">Autopilot Decision</div>
                            <span className={`badge ${decision.decision === 'GO' ? 'go' : decision.decision === 'PIVOT' ? 'pivot' : 'nogo'}`}>
                                {decision.decision} &middot; {decision.confidence_score}% confidence
                            </span>
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
                        <div>
                            <div className="section-header">Executive Summary</div>
                            <div className="ps">
                                <p style={{ fontSize: '14px' }}>{synthesis.executive_summary_narrative || synthesis.executive_summary || synthesis.summary}</p>
                            </div>
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
                                        {c.strengths?.slice(0, 2).map((s, j) => <div key={j} className="str">&plus; {s}</div>)}
                                        {c.weaknesses?.slice(0, 2).map((w, j) => <div key={j} className="gap">&minus; {w}</div>)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {trends.macro_trends?.length > 0 && (
                        <div style={{ pageBreakBefore: 'always' }}>
                            <div className="section-header">Market Trends &amp; Growth</div>
                            {(trends.market_size_estimate || trends.key_drivers?.length > 0) && (
                                <div className="ps" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                                    <div style={{ display: 'flex', gap: '24px', marginBottom: trends.key_drivers?.length > 0 ? '16px' : '0' }}>
                                        {trends.market_size_estimate && <div><div className="metric-label">MARKET SIZE</div><div className="metric-val" style={{ color: '#1d4ed8' }}>{trends.market_size_estimate}</div></div>}
                                        {trends.market_growth_cagr && <div><div className="metric-label">CAGR</div><div className="metric-val" style={{ color: '#1d4ed8' }}>{trends.market_growth_cagr}</div></div>}
                                    </div>
                                    {trends.key_drivers?.length > 0 && (
                                        <div>
                                            <div className="ps-title" style={{ color: '#3b82f6', border: 'none', margin: '0 0 4px', padding: 0 }}>Growth Drivers</div>
                                            <ul style={{ margin: 0, paddingLeft: '16px' }}>{trends.key_drivers.map((d, i) => <li key={i}>{d}</li>)}</ul>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="g2">
                                {[...(trends.macro_trends || []), ...(trends.micro_trends || [])].map((t, i) => (
                                    <div key={i} className="card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div className="card-title">{t.trend}</div>
                                            {t.relevance_score && <div style={{ fontSize: '10px', color: '#1d4ed8', background: '#dbeafe', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>{t.relevance_score}/10</div>}
                                        </div>
                                        {t.description && <p style={{ marginTop: '6px' }}>{t.description}</p>}
                                        {t.impact && <p style={{ color: '#0369a1', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}><strong>Impact:</strong> {t.impact}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {validation.validation_points?.length > 0 && (
                        <div>
                            <div className="section-header">Market Signals &amp; Validation</div>
                            <div className="ps" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', margin: 0 }}>Note: AI-inferred signals</div>
                                <p style={{ fontSize: '11px', color: '#b45309' }}>Signals and willingness-to-pay are extracted via AI pattern inference, not verbatim quotes. Validate via primary research.</p>
                            </div>
                            <div className="g2 mt-4">
                                {validation.validation_points.map((pt, i) => (
                                    <div key={i} className="card">
                                        <div className="card-title">{pt.user_segment}</div>
                                        <p style={{ marginTop: '6px', marginBottom: '8px' }}>{pt.pain_point}</p>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>Sev: {pt.severity}/10 &middot; WTP: {pt.willingness_to_pay}</div>
                                    </div>
                                ))}
                            </div>
                            {validation.adoption_barriers?.length > 0 && (
                                <div className="ps mt-4">
                                    <div className="ps-title">Adoption Barriers</div>
                                    <ul style={{ margin: 0 }}>{validation.adoption_barriers.map((b, i) => <li key={i}>{b}</li>)}</ul>
                                </div>
                            )}
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
                                        Survival Probability: {critic.survival_probability}
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
        )
        : null;

    return (
        <>
            {printContent}
            <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)', display: 'flex', flexDirection: 'column' }}>

                {/* Sticky Header */}
                <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 30 }}>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                            <span>Reports</span>
                            <ChevronRight style={{ width: 14, height: 14 }} />
                            <span style={{ fontWeight: 700, color: '#475569' }}>Analysis Output</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: '0 0 2px', letterSpacing: '-0.02em' }}>
                                    Market Intelligence Report
                                </h1>
                                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Generated {new Date().toLocaleDateString()}</p>
                            </div>
                            <ReportHeaderActions analysisResult={analysisResult} handleExportPDF={handleExportPDF} />
                        </div>
                    </div>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 12px' }}>
                        <SectionNav sections={availableSections} activeSection={activeSection?.id} onChange={goTo} />
                    </div>
                </div>

                {/* Content */}
                <div ref={contentRef} style={{ flex: 1, overflowY: 'auto' }}>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
                        {activeSection && renderSection(activeSection.id)}
                    </div>
                </div>

                {/* Bottom Nav */}
                <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid #e2e8f0', position: 'sticky', bottom: 0, zIndex: 30 }}>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <button
                            onClick={() => canPrev && setActiveSectionIdx(activeSectionIdx - 1)}
                            disabled={!canPrev}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: canPrev ? 'white' : '#f8fafc', fontSize: 13, fontWeight: 600, color: canPrev ? '#374151' : '#cbd5e1', cursor: canPrev ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}
                        >
                            <ArrowLeft style={{ width: 14, height: 14 }} />
                            {canPrev ? availableSections[activeSectionIdx - 1].label : 'Back'}
                        </button>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                                {activeSectionIdx + 1} / {availableSections.length}
                            </span>
                            <div style={{ display: 'flex', gap: 4 }}>
                                {availableSections.map((_, i) => (
                                    <div key={i} onClick={() => setActiveSectionIdx(i)} style={{ width: i === activeSectionIdx ? 16 : 6, height: 6, borderRadius: 999, background: i === activeSectionIdx ? (activeSection?.color || '#1e293b') : '#e2e8f0', cursor: 'pointer', transition: 'all 0.2s' }} />
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => canNext && setActiveSectionIdx(activeSectionIdx + 1)}
                            disabled={!canNext}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: canNext ? 'white' : '#f8fafc', fontSize: 13, fontWeight: 600, color: canNext ? '#374151' : '#cbd5e1', cursor: canNext ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}
                        >
                            {canNext ? availableSections[activeSectionIdx + 1].label : 'Done'}
                            <ArrowRight style={{ width: 14, height: 14 }} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
