import React from 'react';
import { useStore } from '../store/useStore';
import { Plus, Sparkles, X, History, Lightbulb, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Home() {
    const { analysisInput, setAnalysisInput, contextTags, addTag, removeTag, startAnalysis, isGenerating } = useStore();
    const navigate = useNavigate();

    const handleGenerate = async () => {
        if (!analysisInput.trim()) return;
        try {
            await startAnalysis();
            navigate('/active-analysis');
        } catch (e) {
            alert("Failed to start analysis: " + e.message);
        }
    };

    const categories = [
        { id: 'industry', label: 'Industry', placeholder: 'e.g. Fintech, EdTech' },
        { id: 'geo', label: 'Geography', placeholder: 'e.g. South East Asia' },
        { id: 'segment', label: 'User Segment', placeholder: 'e.g. Gen Z, SMBs' }
    ];

    return (
        <div className="max-w-6xl mx-auto py-16 px-6">

            {/* Hero Section */}
            <div className="flex flex-col items-center text-center mb-16 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-sm font-semibold tracking-wide mb-4">
                    <Sparkles className="w-4 h-4" />
                    <span>Autonomous Market Intelligence</span>
                </div>

                <h1 className="text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 max-w-4xl mx-auto leading-[1.1]">
                    Turn messy thoughts into <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">market intelligence.</span>
                </h1>

                <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Describe your startup idea. Our autonomous agents will research the market, analyze competitors, and validate your hypothesis in minutes.
                </p>
            </div>

            {/* Main Input Card */}
            <div className="max-w-4xl mx-auto relative group">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

                <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-8">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-lg">
                                <Lightbulb className="w-6 h-6" />
                            </div>
                            <textarea
                                value={analysisInput}
                                onChange={(e) => setAnalysisInput(e.target.value)}
                                placeholder="I'm thinking about a B2B SaaS for dog walkers in urban areas who struggle with scheduling and payments. Is the market saturated? Who are the big players?"
                                className="w-full h-40 text-xl leading-relaxed p-0 border-none focus:ring-0 resize-none bg-transparent text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-500 font-medium"
                            />
                        </div>
                    </div>

                    {/* Context Tags */}
                    <div className="px-8 pb-8 space-y-6">
                        <div className="h-px bg-slate-100 dark:bg-slate-700 w-full mb-6"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {categories.map((cat) => (
                                <div key={cat.id} className="group/input">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 group-focus-within/input:text-blue-600 transition-colors">
                                        {cat.label}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder={cat.placeholder}
                                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    addTag(cat.id, e.currentTarget.value);
                                                    e.currentTarget.value = '';
                                                }
                                            }}
                                        />
                                        <Plus className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2 min-h-[20px]">
                                        {contextTags[cat.id]?.map((tag, idx) => (
                                            <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 animate-in fade-in zoom-in duration-200">
                                                {tag}
                                                <button onClick={() => removeTag(cat.id, tag)} className="ml-1.5 text-blue-400 hover:text-blue-600">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Footer */}
                    <div className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 flex justify-between items-center border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium pl-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            {analysisInput.length > 20 ? "Agents ready to launch" : "Waiting for input..."}
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={!analysisInput.trim() || isGenerating}
                            className="flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-indigo-200 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isGenerating ? "Starting swarm..." : (
                                <>
                                    Generate Report
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Explorations */}
            <div className="max-w-6xl mx-auto mt-20">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Recent Explorations
                    </h3>
                    <button className="text-sm text-blue-600 font-medium hover:underline">View all</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { title: "Ghost Kitchen Analytics", subtitle: "B2B SaaS for restaurant delivery optimization", time: "2h ago", icon: "🍳" },
                        { title: "Sustainable Packaging", subtitle: "Eco-friendly materials marketplace", time: "1d ago", icon: "📦" },
                        { title: "Telehealth for Seniors", subtitle: "Remote monitoring hardware + AI", time: "3d ago", icon: "🏥" }
                    ].map((item, i) => (
                        <div key={i} className="group bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-blue-100 dark:hover:border-blue-800">
                            <div className="flex justify-between items-start mb-4">
                                <div className="text-2xl bg-slate-50 dark:bg-slate-700 p-3 rounded-xl group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors">{item.icon}</div>
                                <span className="text-xs font-semibold text-slate-400 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded-md">{item.time}</span>
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-1 group-hover:text-blue-600 transition-colors">{item.title}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{item.subtitle}</p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
