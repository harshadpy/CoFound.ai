import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    Sparkles,
    Lightbulb,
    TrendingUp,
    Target,
    GitCompare,
    Bookmark,
    Settings,
    FileText,
    Moon,
    Sun,
    Zap,
    Wrench
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';

export function Sidebar() {
    const { user, analysisResult, isDark, toggleDark } = useStore();

    const researchTools = [
        { name: "Idea Brainstorming", icon: Lightbulb, to: "/brainstorming" },
        { name: "Trend Explorer", icon: TrendingUp, to: "/trends" },
        { name: "Market Gaps", icon: Target, to: "/market-gaps" },
        { name: "Competitor Research", icon: GitCompare, to: "/competitors" },
    ];

    return (
        <aside className="w-64 h-screen bg-white dark:bg-slate-900 border-r border-border dark:border-slate-700 flex flex-col fixed left-0 top-0 overflow-y-auto transition-colors duration-200">

            {/* Logo */}
            <div className="p-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    C
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">CoFound<span className="text-blue-600">.ai</span></span>
            </div>

            <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">

                {/* ── AUTONOMOUS ANALYSIS ── */}
                <div className="mb-3">
                    <div className="flex items-center gap-1.5 px-2 mb-2">
                        <Zap className="w-3 h-3 text-blue-500" />
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Autonomous</span>
                    </div>

                    {/* Main CTA — visually distinct gradient card */}
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border",
                                isActive
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-lg shadow-blue-200 dark:shadow-blue-900"
                                    : "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900 dark:hover:to-indigo-900"
                            )
                        }
                    >
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span>Autonomous Analysis</span>
                    </NavLink>

                    {/* Report link — only shown when report exists */}
                    {analysisResult && (
                        <NavLink
                            to="/report"
                            className={({ isActive }) =>
                                cn(
                                    "mt-1.5 flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all border",
                                    isActive
                                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                        : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900"
                                )
                            }
                        >
                            <FileText className="w-4 h-4 shrink-0" />
                            <span className="truncate flex-1">View Report</span>
                            <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-full shrink-0">READY</span>
                        </NavLink>
                    )}
                </div>

                {/* Divider with label */}
                <div className="flex items-center gap-2 py-1 px-2">
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                    <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest whitespace-nowrap">manual tools</span>
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                </div>

                {/* ── RESEARCH TOOLS ── */}
                <div>
                    <div className="flex items-center gap-1.5 px-2 mb-2 mt-1">
                        <Wrench className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Research Tools</span>
                    </div>
                    <div className="space-y-0.5">
                        {researchTools.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.to}
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-800 dark:hover:text-slate-200"
                                    )
                                }
                            >
                                <item.icon className="w-4 h-4 shrink-0" />
                                {item.name}
                            </NavLink>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100 dark:bg-slate-800 mx-2 my-1" />

                {/* ── LIBRARY ── */}
                <div>
                    <div className="flex items-center gap-1.5 px-2 mb-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Library</span>
                    </div>
                    <NavLink
                        to="/saved"
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-800 dark:hover:text-slate-200"
                            )
                        }
                    >
                        <Bookmark className="w-4 h-4 shrink-0" />
                        Saved Insights
                    </NavLink>
                </div>

            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-border dark:border-slate-700">
                <div className="mb-2 flex items-center gap-1">
                    <a href="#" className="flex-1 flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100">
                        <Settings className="w-4 h-4" />
                        Settings
                    </a>
                    {/* Dark Mode Toggle */}
                    <button
                        onClick={toggleDark}
                        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        className={cn(
                            "p-2 rounded-md text-sm transition-colors",
                            isDark
                                ? "text-yellow-400 hover:bg-slate-800 hover:text-yellow-300"
                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        )}
                    >
                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                </div>
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xs ring-2 ring-white dark:ring-slate-900">
                        {user.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 truncate">{user.plan}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
