import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Sparkles, X, Lightbulb, ArrowRight, Brain, BarChart2, Shield, Globe, Tag, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '../lib/utils';
import { useToast } from '../components/ui';
import StartupParallaxCanvas from '../components/canvas/StartupParallaxCanvas';

const STATS = [
    { icon: Brain,    value: "11",     label: "AI Agents" },
    { icon: BarChart2,value: "< 3 min",label: "Time to insight" },
    { icon: Shield,   value: "100%",   label: "Private & secure" },
];

const CURATED_EXAMPLES = [
    {
        title: "AI Medical Coding & TPA Pre-Auth",
        desc: "Autonomous workflow ingesting hospital discharge papers, mapping ICD-10/CPT codes, and submitting insurance claims to eliminate rejection delays.",
        icon: "🩺",
        industry: "HealthTech & AI",
        geo: "India",
        segment: "Private Hospitals & TPAs"
    },
    {
        title: "Cross-Border Trade OS for Exporters",
        desc: "Single-window compliance, automated customs classification, FX hedging, and digital bill-of-lading for textile and handicraft manufacturers.",
        icon: "🚢",
        industry: "Fintech & Supply Chain",
        geo: "India",
        segment: "MSME Exporters"
    },
    {
        title: "Autonomous WhatsApp B2B Sales SDR",
        desc: "Voice and chat AI agents that qualify inbound dealer inquiries, query inventory in Tally/Zoho, and generate instant purchase orders over WhatsApp.",
        icon: "💬",
        industry: "Enterprise B2B SaaS",
        geo: "India",
        segment: "Distributors & FMCG Brands"
    },
    {
        title: "EV Battery Telematics & 2nd-Life Grid",
        desc: "IoT battery health diagnostic platform offering real-time state-of-health tracking, swap management, and secondary energy storage recycling for fleets.",
        icon: "⚡",
        industry: "CleanTech & EV Mobility",
        geo: "India",
        segment: "Commercial Fleet Operators"
    },
    {
        title: "AI Contract Redliner for Indian Law",
        desc: "Domain-adapted legal intelligence trained on Indian Contract Act, DPDP 2023, and GST rules to redline vendor agreements in under 60 seconds.",
        icon: "⚖️",
        industry: "LegalTech & Enterprise AI",
        geo: "India",
        segment: "Corporate Legal & Startups"
    },
    {
        title: "Decentralized Rooftop Solar Financing",
        desc: "Underwriting engine and remote IoT energy generation monitoring enabling low-friction debt financing for factory rooftop solar plants.",
        icon: "☀️",
        industry: "Climate Fintech",
        geo: "India",
        segment: "C&I Factory Owners"
    },
    {
        title: "Dark Store Hyperlocal Demand Predictor",
        desc: "Predictive replenishment agent analyzing weather, regional holidays, and local search signals to eliminate stockouts in 10-minute grocery delivery.",
        icon: "📦",
        industry: "Retail & Supply Chain",
        geo: "India",
        segment: "Quick Commerce Dark Stores"
    },
    {
        title: "Vernacular Clinical Ambient Scribe",
        desc: "Ambient listening assistant fluent in code-switching (Hinglish/Tamil/Telugu) converting high-volume OPD consultations into structured EMR records.",
        icon: "🎙️",
        industry: "HealthTech & AI",
        geo: "India",
        segment: "Tier-2/3 OPD Clinicians"
    },
    {
        title: "Cloud GPU Cluster Scheduler for AI Labs",
        desc: "Multi-cloud spot GPU orchestrator that harvests idle H100 capacity, auto-checkpoints weights, and slashes model training costs by 45%.",
        icon: "🧠",
        industry: "Developer Infra & AI",
        geo: "Global",
        segment: "AI Labs & Growth Startups"
    },
];

function TiltExampleCard({ item, onClick }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x, { stiffness: 240, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 240, damping: 20 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7deg', '-7deg']);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7deg', '7deg']);

    const handleMouseMove = (e) => {
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        x.set(mouseX / rect.width - 0.5);
        y.set(mouseY / rect.height - 0.5);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.button
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            whileHover={{ scale: 1.025 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            aria-label={`Load hypothesis: ${item.title}`}
            className="group text-left p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/90 bg-card shadow-sm hover:shadow-xl hover:border-primary/40 transition-colors duration-150 flex flex-col h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 relative"
        >
            <div className="flex items-start gap-3 mb-2">
                <span className="text-2xl p-1.5 bg-muted rounded-lg shrink-0" aria-hidden="true">{item.icon}</span>
                <div>
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">{item.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-900/80">
                            {item.geo}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[120px]">
                            {item.industry}
                        </span>
                    </div>
                </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed flex-1 font-medium">{item.desc}</p>
            <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[11px] text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Load hypothesis & tags</span>
                <ArrowRight className="w-3 h-3" />
            </div>
        </motion.button>
    );
}

export default function Home() {
    const { analysisInput, setAnalysisInput, contextTags, setContextTags, addTag, removeTag, startAnalysis, isGenerating, openHowToUse } = useStore();
    const [tagInputs, setTagInputs] = useState({ industry: '', geo: '', segment: '' });
    const navigate = useNavigate();
    const toast = useToast();

    // First-time user onboarding detection
    useEffect(() => {
        try {
            const hasSeenGuide = localStorage.getItem('cofound_has_seen_guide');
            if (!hasSeenGuide) {
                const timer = setTimeout(() => {
                    toast(
                        'New to CoFound? Click "How to Use" in the sidebar anytime to explore workflows.',
                        'info'
                    );
                    localStorage.setItem('cofound_has_seen_guide', 'true');
                }, 900);
                return () => clearTimeout(timer);
            }
        } catch {}
    }, [toast]);

    const commitTag = (catId) => {
        const val = tagInputs[catId]?.trim();
        if (val) {
            addTag(catId, val);
            setTagInputs(prev => ({ ...prev, [catId]: '' }));
        }
    };

    const handleGenerate = async () => {
        if (!analysisInput.trim()) return;

        // Auto-commit any non-empty input currently typed in any filter box
        const effectiveTags = {
            industry: [...(contextTags.industry || [])],
            geo: [...(contextTags.geo || [])],
            segment: [...(contextTags.segment || [])],
        };

        Object.entries(tagInputs).forEach(([catId, val]) => {
            const trimmed = val.trim();
            if (trimmed && !effectiveTags[catId].includes(trimmed)) {
                effectiveTags[catId].push(trimmed);
            }
        });

        // Sync local input state
        setTagInputs({ industry: '', geo: '', segment: '' });

        try {
            await startAnalysis(effectiveTags);
            navigate('/active-analysis');
        } catch (e) {
            alert("Failed to start analysis: " + e.message);
        }
    };

    const handleApplyExample = (item) => {
        setAnalysisInput(`${item.title}: ${item.desc}`);
        setContextTags({
            industry: [item.industry],
            geo: [item.geo],
            segment: [item.segment]
        });
        setTagInputs({ industry: '', geo: '', segment: '' });
    };

    const categories = [
        { id: 'industry', label: 'Industry',      placeholder: 'e.g. HealthTech, B2B SaaS' },
        { id: 'geo',      label: 'Geography',     placeholder: 'e.g. India, Southeast Asia' },
        { id: 'segment',  label: 'User Segment',  placeholder: 'e.g. SMBs, Mid-market, Gen Z' }
    ];

    const ready = analysisInput.trim().length > 15;

    // ── Phase 3E: Enhanced multi-plane mouse parallax on hero ──
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springConfig = { damping: 20, stiffness: 120 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    // Floating ambient glow moving counter to mouse
    const glowX = useTransform(springX, [-0.5, 0.5], [45, -45]);
    const glowY = useTransform(springY, [-0.5, 0.5], [35, -35]);

    // Multi-depth planes
    const badgeX = useTransform(springX, [-0.5, 0.5], [-8, 8]);
    const badgeY = useTransform(springY, [-0.5, 0.5], [-6, 6]);
    const headlineX = useTransform(springX, [-0.5, 0.5], [-16, 16]);
    const headlineY = useTransform(springY, [-0.5, 0.5], [-10, 10]);
    const subX = useTransform(springX, [-0.5, 0.5], [-10, 10]);
    const subY = useTransform(springY, [-0.5, 0.5], [-8, 8]);

    // 3D Perspective card tilt
    const cardX = useTransform(springX, [-0.5, 0.5], [-14, 14]);
    const cardY = useTransform(springY, [-0.5, 0.5], [-10, 10]);
    const cardRotX = useTransform(springY, [-0.5, 0.5], [4.5, -4.5]);
    const cardRotY = useTransform(springX, [-0.5, 0.5], [-4.5, 4.5]);

    const handleMouseMove = (e) => {
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        mouseX.set(x);
        mouseY.set(y);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    return (
        <div 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="max-w-5xl mx-auto px-6 relative z-10 overflow-visible"
        >
            {/* 3D Three.js Floating Intelligence Parallax Background */}
            <StartupParallaxCanvas />

            {/* ── Opening Viewport Screen (Vertically Centered) ── */}
            <div className="min-h-[calc(100vh-3.5rem)] flex flex-col justify-center items-center py-4 relative">
                {/* Ambient Parallax Radial Glow */}
                <motion.div 
                    style={{ x: glowX, y: glowY }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[360px] bg-primary/10 dark:bg-primary/15 blur-[100px] rounded-full pointer-events-none -z-10"
                    aria-hidden="true"
                />

                {/* ── Hero ── */}
                <div className="flex flex-col items-center text-center mb-6 space-y-3.5">
                    <motion.div
                        style={{ x: badgeX, y: badgeY }}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400 text-xs font-semibold tracking-widest uppercase"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 pulse-dot" />
                        Agentic Market Intelligence
                    </motion.div>

                    <motion.h1
                        style={{ x: headlineX, y: headlineY }}
                        className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 max-w-3xl leading-[1.18]"
                    >
                        Turn messy ideas into{' '}
                        <span className="gradient-text">market intelligence.</span>
                    </motion.h1>

                    <motion.p
                        style={{ x: subX, y: subY }}
                        className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed"
                    >
                        Describe your startup hypothesis. Our swarm of AI agents will validate it, map competitors, and surface market gaps in minutes.
                    </motion.p>
                </div>

                {/* ── Main Input Card ── */}
                <motion.div 
                    style={{ x: cardX, y: cardY, rotateX: cardRotX, rotateY: cardRotY, perspective: 1200 }}
                    className="w-full max-w-3xl mx-auto"
                >
                    <div className="relative rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-slate-900/60 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden transition-shadow duration-300 hover:shadow-2xl hover:shadow-blue-100/40 dark:hover:shadow-blue-900/20">

                        {/* Textarea area */}
                        <div className="p-5 pb-3 md:p-6 md:pb-3.5">
                            <div className="flex items-start gap-3.5">
                                <div className="mt-0.5 p-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                                    <Lightbulb className="w-4 h-4" />
                                </div>
                                <textarea
                                    value={analysisInput}
                                    onChange={(e) => setAnalysisInput(e.target.value)}
                                    placeholder="Describe your startup hypothesis, e.g. An AI-powered SDR for Indian distributors operating on WhatsApp with Tally integration..."
                                    className="w-full h-20 md:h-24 text-base md:text-lg leading-relaxed p-0 border-none focus:ring-0 resize-none bg-transparent text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 font-medium outline-none"
                                />
                            </div>
                        </div>

                        {/* Context Tags */}
                        <div className="px-5 pb-4 md:px-6 md:pb-4.5">
                            <div className="h-px bg-slate-100 dark:bg-slate-700 mb-3.5" />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                {categories.map((cat) => (
                                    <div key={cat.id}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label
                                                htmlFor={`tag-input-${cat.id}`}
                                                className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest"
                                            >
                                                {cat.label}
                                            </label>
                                            {cat.id === 'geo' && (
                                                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                                    <Globe className="w-2.5 h-2.5" aria-hidden="true" /> Market Focus
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <input
                                                id={`tag-input-${cat.id}`}
                                                type="text"
                                                value={tagInputs[cat.id]}
                                                onChange={(e) => setTagInputs({ ...tagInputs, [cat.id]: e.target.value })}
                                                placeholder={cat.placeholder}
                                                className="w-full bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 pr-7 text-xs sm:text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 dark:focus:ring-blue-950 transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        commitTag(cat.id);
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => commitTag(cat.id)}
                                                aria-label={`Add ${cat.label} tag`}
                                                className="absolute right-1.5 top-1.5 p-0.5 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                                            >
                                                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-1.5 min-h-[16px]">
                                            {contextTags[cat.id]?.map((tag, idx) => (
                                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900 shadow-xs animate-fade-in">
                                                    {tag}
                                                    <button 
                                                        type="button"
                                                        onClick={() => removeTag(cat.id, tag)}
                                                        aria-label={`Remove ${cat.label} tag: ${tag}`}
                                                        className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-xs"
                                                    >
                                                        <X className="w-2.5 h-2.5" aria-hidden="true" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Strip */}
                        <div className="bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-sm px-5 py-3 md:px-6 md:py-3.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-2 text-xs md:text-sm text-slate-400 dark:text-slate-500 font-medium">
                                <div className={cn(
                                    "w-2 h-2 rounded-full transition-colors duration-500",
                                    ready ? "bg-emerald-500 pulse-dot" : "bg-slate-300 dark:bg-slate-600"
                                )} />
                                <span className={cn("transition-colors", ready ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "")}>
                                    {ready ? "Agents ready to launch" : "Describe your idea above…"}
                                </span>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={!ready || isGenerating}
                                aria-label={isGenerating ? 'Launching agents' : 'Generate Report'}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors duration-200",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                    ready && !isGenerating
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                                )}
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                        Launching agents…
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" aria-hidden="true" />
                                        Generate Report
                                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ── Stats Bar (Positioned below the opening centered screen) ── */}
            <div className="max-w-3xl mx-auto mb-16 pt-8 animate-fade-in-up">
                <div className="grid grid-cols-3 gap-4">
                    {STATS.map(({ icon: Icon, value, label }) => (
                        <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className="p-1.5 bg-blue-50 dark:bg-blue-950 rounded-lg text-blue-600 dark:text-blue-400">
                                <Icon className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{value}</p>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Curated Startup Hypotheses ── */}
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Curated Startup Hypotheses
                    </p>
                    <button 
                        onClick={() => navigate('/ideas')}
                        aria-label="Explore all ideas"
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm"
                    >
                        Explore 24+ more ideas <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {CURATED_EXAMPLES.map((item, i) => (
                        <TiltExampleCard
                            key={i}
                            item={item}
                            onClick={() => handleApplyExample(item)}
                        />
                    ))}
                </div>
            </div>

        </div>
    );
}
