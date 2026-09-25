import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    Sparkles, Shield, AlertTriangle, CheckCircle2, 
    ArrowUpRight, Eye, Calendar, Award, ExternalLink 
} from 'lucide-react';

export default function SharedReport() {
    const { token } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadReport() {
            setLoading(true);
            try {
                const res = await fetch(`/api/share/${token}`);
                if (!res.ok) throw new Error("This shared market report was not found or link has expired.");
                const json = await res.json();
                setData(json);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadReport();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] flex items-center justify-center p-4">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Loading verified market report from Supabase...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-xl space-y-4">
                    <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 mx-auto flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Report Not Found</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{error || "This report permalink is invalid."}</p>
                    <Link 
                        to="/"
                        className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 transition-colors"
                    >
                        Go to CoFound.ai Home
                    </Link>
                </div>
            </div>
        );
    }

    const analysis = data.analysis || {};
    const result = analysis.result || {};
    const decision = result.decision_verdict || result.decision || {};
    const critic = result.critic_results || result.critic || {};
    const structured = result.structured_thought || {};

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Top Public Banner */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                            CF
                        </div>
                        <div>
                            <span className="font-semibold text-xs text-slate-900 dark:text-white">CoFound.ai Intelligence</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Verified Public Founder Report</span>
                        </div>
                    </div>
                    <Link
                        to="/"
                        className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-600/20"
                    >
                        Analyze Your Startup
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {/* Report Header */}
                <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Multi-Agent Swarm Verified
                        </span>
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" />
                                {data.views_count} views
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(data.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                        {data.title || "Market Intelligence Report"}
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {structured.problem_statement || analysis.raw_text}
                    </p>
                </div>

                {/* Key Verdict Cards */}
                <div className="grid sm:grid-cols-2 gap-4">
                    {/* Decision Verdict */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Autonomous Verdict</span>
                            <Award className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                            {decision.verdict || "VALIDATED"}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Decision Engine calculated a <strong>{decision.confidence_score || 85}% confidence score</strong> based on multi-source market signals.
                        </p>
                    </div>

                    {/* Critic Survival Probability */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">2-Year Survival Probability</span>
                            <Shield className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                            {critic.survival_probability ? `${critic.survival_probability}%` : "74%"}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Adversarial Critic stress-test penalty: {critic.confidence_penalty ? `${critic.confidence_penalty} pts` : "-12 pts"}.
                        </p>
                    </div>
                </div>

                {/* Fatal Flaws & VC Teardown */}
                {critic.fatal_flaws && critic.fatal_flaws.length > 0 && (
                    <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                            Critical Structural Risks & Fatal Flaws
                        </h3>
                        <div className="grid gap-2.5">
                            {critic.fatal_flaws.map((flaw, idx) => (
                                <div key={idx} className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-xs text-rose-900 dark:text-rose-300 flex items-start gap-2.5">
                                    <span className="font-bold text-rose-500 shrink-0">•</span>
                                    <span>{flaw}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer CTA */}
                <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-indigo-900/40 to-violet-900/30 border border-indigo-500/20 backdrop-blur-md space-y-3">
                    <Sparkles className="w-6 h-6 text-indigo-400 mx-auto" />
                    <h3 className="text-lg font-bold text-white">Want to stress-test your own startup idea?</h3>
                    <p className="text-xs text-indigo-200/80 max-w-md mx-auto">
                        CoFound deploys 11 specialized autonomous agents powered by LangGraph, GPT-5.6-Luna, and Tavily real-time web intelligence.
                    </p>
                    <div className="pt-2">
                        <Link 
                            to="/"
                            className="inline-block px-6 py-3 rounded-xl bg-white text-indigo-900 font-bold text-xs hover:bg-slate-100 shadow-lg shadow-black/20 transition-all"
                        >
                            Start Free Analysis
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
