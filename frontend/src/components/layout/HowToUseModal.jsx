import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X,
    Sparkles,
    TrendingUp,
    Lightbulb,
    GitCompare,
    Target,
    ArrowRight,
    Compass,
    CheckCircle2,
    Play,
    Zap,
    BookOpen,
    HelpCircle,
    ChevronRight,
    Layers
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui';

const WORKFLOW_PATHS = [
    {
        id: 'direct-swarm',
        badge: 'Recommended for Most Founders',
        badgeVariant: 'primary',
        icon: Sparkles,
        title: 'Direct 11-Agent Swarm Analysis',
        tagline: 'When you already have a seed idea or pitch',
        steps: [
            { step: '1', text: 'Enter your unstructured concept or pitch on the Home page.' },
            { step: '2', text: 'Optionally set Geography (e.g. India, US) & Industry tags.' },
            { step: '3', text: 'Click "Start Agentic Analysis" — 11 AI agents execute in parallel.' },
            { step: '4', text: 'Receive an institutional Go / Pivot / Kill verdict with financial unit economics & adversary critic red flags.' }
        ],
        ctaText: 'Go to Agentic Analysis',
        actionRoute: '/',
    },
    {
        id: 'research-first',
        badge: 'Market Sizing & Moats',
        badgeVariant: 'emerald',
        icon: TrendingUp,
        title: 'Research-First Discovery',
        tagline: 'When you want to validate market trends & competitors first',
        steps: [
            { step: '1', text: 'Visit Trend Explorer (/trends) to quantify TAM sizing and growth CAGR.' },
            { step: '2', text: 'Scan Competitor Radar (/competitors) to inspect incumbents and saturation.' },
            { step: '3', text: 'Check Market Gaps (/market-gaps) for verified customer pain signals.' },
            { step: '4', text: 'Click "Launch Swarm Report" on any research finding to graduate it into a full venture analysis.' }
        ],
        ctaText: 'Explore Trends & TAM',
        actionRoute: '/trends',
    },
    {
        id: 'brainstorm-pivot',
        badge: 'Ideation & Pivots',
        badgeVariant: 'violet',
        icon: Lightbulb,
        title: 'Brainstorm & Pivot Exploration',
        tagline: 'When you have a rough problem but need wedges & business models',
        steps: [
            { step: '1', text: 'Head to Idea Brainstorming (/brainstorm).' },
            { step: '2', text: 'Enter your core problem or select a high-conviction preset.' },
            { step: '3', text: 'Generate expanded business model variations, initial wedges, and contingency pivots.' },
            { step: '4', text: 'Click "Analyze in Swarm" or "Pivot Swarm" on any variation to test viability.' }
        ],
        ctaText: 'Brainstorm Startup Ideas',
        actionRoute: '/brainstorm',
    }
];

export function HowToUseModal({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [selectedPath, setSelectedPath] = useState('direct-swarm');

    if (!isOpen) return null;

    const currentPath = WORKFLOW_PATHS.find(p => p.id === selectedPath) || WORKFLOW_PATHS[0];

    const handleNavigate = (route) => {
        onClose();
        navigate(route);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="how-to-use-title"
        >
            <div className="relative w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-sm">
                            <Compass className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 id="how-to-use-title" className="text-xl font-bold text-foreground">
                                How to Use CoFound.ai
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Master our agentic market intelligence workflows in under 2 minutes
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close guide"
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    
                    {/* Workflow Selector Tabs */}
                    <div>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-2.5">
                            Choose Your Starting Point:
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {WORKFLOW_PATHS.map((path) => {
                                const Icon = path.icon;
                                const isSelected = selectedPath === path.id;
                                return (
                                    <button
                                        key={path.id}
                                        type="button"
                                        onClick={() => setSelectedPath(path.id)}
                                        className={cn(
                                            "text-left p-4 rounded-xl border transition-all flex flex-col justify-between",
                                            isSelected
                                                ? "bg-primary/10 border-primary/50 shadow-sm ring-1 ring-primary/40"
                                                : "bg-muted/40 border-border hover:border-border/80 hover:bg-muted/70"
                                        )}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs",
                                                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                                                )}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <span className={cn(
                                                    "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                                    path.badgeVariant === 'primary' ? "bg-primary/20 text-primary" :
                                                    path.badgeVariant === 'emerald' ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                                                    "bg-violet-500/20 text-violet-600 dark:text-violet-400"
                                                )}>
                                                    {path.badge}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-sm text-foreground mb-1">{path.title}</h3>
                                            <p className="text-xs text-muted-foreground leading-relaxed">{path.tagline}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Active Workflow Deep-Dive */}
                    <div className="bg-muted/30 border border-border/80 rounded-2xl p-6 relative overflow-hidden">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                                    Step-by-Step Walkthrough
                                </span>
                                <h3 className="text-lg font-extrabold text-foreground mt-0.5">
                                    {currentPath.title}
                                </h3>
                            </div>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleNavigate(currentPath.actionRoute)}
                                className="shrink-0 flex items-center gap-1.5 shadow-sm"
                            >
                                <span>{currentPath.ctaText}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                        </div>

                        {/* Steps Timeline */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
                            {currentPath.steps.map((s, idx) => (
                                <div key={idx} className="bg-card p-4 rounded-xl border border-border/70 flex items-start gap-3 shadow-xs">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                                        {s.step}
                                    </div>
                                    <p className="text-xs sm:text-sm text-foreground font-medium leading-relaxed">
                                        {s.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Key Architecture Callouts */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
                        <div className="p-3.5 rounded-xl bg-card border border-border flex items-start gap-2.5">
                            <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold text-foreground">11 Agentic Agents</h4>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Parallel web-grounded research via Tavily AI + GPT-5.6-Luna.</p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-card border border-border flex items-start gap-2.5">
                            <Layers className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold text-foreground">Adversarial Critic Gate</h4>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Applies confidence penalty (-5 to -35 pts) & uncovers fatal flaws.</p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-card border border-border flex items-start gap-2.5">
                            <BookOpen className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold text-foreground">Dossier Export</h4>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Export consultant-grade PDF or Markdown founder dossiers anytime.</p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-border bg-muted/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">
                        Tip: You can re-open this anytime by clicking <strong>"How to Use"</strong> in the sidebar.
                    </span>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button variant="outline" size="sm" onClick={onClose} className="w-full sm:w-auto">
                            Close
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleNavigate(currentPath.actionRoute)}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5"
                        >
                            <span>Launch {currentPath.title.split(' ')[0]}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}
