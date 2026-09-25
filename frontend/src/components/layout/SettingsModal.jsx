import React, { useState, useEffect } from 'react';
import { 
    X, User, Key, Shield, Check, AlertCircle, 
    Sparkles, Database, ExternalLink, RefreshCw, LogOut 
} from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function SettingsModal() {
    const { 
        settingsOpen, 
        closeSettings, 
        user, 
        fetchUserProfile, 
        updateUserProfile, 
        updateApiKeys, 
        updatePlan,
        logout 
    } = useStore();

    const [activeTab, setActiveTab] = useState('account'); // 'account' | 'keys' | 'subscription'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [openaiKey, setOpenaiKey] = useState('');
    const [tavilyKey, setTavilyKey] = useState('');
    const [geminiKey, setGeminiKey] = useState('');
    const [anthropicKey, setAnthropicKey] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);

    useEffect(() => {
        if (settingsOpen) {
            fetchUserProfile();
            setName(user.name || '');
            setEmail(user.email || '');
            setOpenaiKey('');
            setTavilyKey('');
            setGeminiKey('');
            setAnthropicKey('');
            setStatusMessage(null);
        }
    }, [settingsOpen]);

    if (!settingsOpen) return null;

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setStatusMessage(null);
        const ok = await updateUserProfile({ full_name: name, email });
        setIsSaving(false);
        if (ok) {
            setStatusMessage({ type: 'success', text: 'Profile updated in Supabase cloud.' });
        } else {
            setStatusMessage({ type: 'error', text: 'Failed to update profile.' });
        }
    };

    const handleSaveKeys = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setStatusMessage(null);
        const payload = {};
        if (openaiKey.trim()) payload.openai_api_key = openaiKey.trim();
        if (tavilyKey.trim()) payload.tavily_api_key = tavilyKey.trim();
        if (geminiKey.trim()) payload.gemini_api_key = geminiKey.trim();
        if (anthropicKey.trim()) payload.anthropic_api_key = anthropicKey.trim();

        const ok = await updateApiKeys(payload);
        setIsSaving(false);
        if (ok) {
            setStatusMessage({ type: 'success', text: 'BYOK API keys securely saved in Supabase.' });
            setOpenaiKey('');
            setTavilyKey('');
            setGeminiKey('');
            setAnthropicKey('');
        } else {
            setStatusMessage({ type: 'error', text: 'Failed to save API keys.' });
        }
    };

    const handleSelectPlan = async (newPlan) => {
        setIsSaving(true);
        const ok = await updatePlan(newPlan);
        setIsSaving(false);
        if (ok) {
            setStatusMessage({ type: 'success', text: `Subscription upgraded to ${newPlan.toUpperCase()}!` });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div 
                className="relative w-full max-w-2xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0E1322]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white text-base">Platform & Cloud Settings</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Supabase PostgreSQL Connected
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={closeSettings}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 gap-6 text-xs font-medium bg-white dark:bg-[#0B0F19]">
                    <button
                        onClick={() => { setActiveTab('account'); setStatusMessage(null); }}
                        className={`py-3.5 border-b-2 flex items-center gap-2 transition-all ${
                            activeTab === 'account'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold'
                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <User className="w-4 h-4" />
                        Account & Profile
                    </button>
                    <button
                        onClick={() => { setActiveTab('keys'); setStatusMessage(null); }}
                        className={`py-3.5 border-b-2 flex items-center gap-2 transition-all ${
                            activeTab === 'keys'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold'
                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <Key className="w-4 h-4" />
                        Custom API Keys (BYOK)
                    </button>
                    <button
                        onClick={() => { setActiveTab('subscription'); setStatusMessage(null); }}
                        className={`py-3.5 border-b-2 flex items-center gap-2 transition-all ${
                            activeTab === 'subscription'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold'
                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        Subscription Plan
                    </button>
                </div>

                {/* Status message */}
                {statusMessage && (
                    <div className={`mx-6 mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${
                        statusMessage.type === 'success' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}>
                        {statusMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {statusMessage.text}
                    </div>
                )}

                {/* Tab Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {/* ACCOUNT TAB */}
                    {activeTab === 'account' && (
                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Founder Full Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Harshad"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="founder@company.com"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                            </div>
                            <div className="pt-4 flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800 mt-5">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                    Save Profile Changes
                                </button>
                                <button
                                    type="button"
                                    onClick={logout}
                                    className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors flex items-center gap-1.5"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </form>
                    )}

                    {/* BYOK KEYS TAB */}
                    {activeTab === 'keys' && (
                        <form onSubmit={handleSaveKeys} className="space-y-4">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                CoFound provides institutional GPT-5.6-Luna and Tavily search out-of-the-box. You can also configure your own keys to bypass platform rate limits.
                            </p>

                            {/* OpenAI */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        OpenAI API Key
                                    </label>
                                    {user.masked_keys?.openai && (
                                        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                            Active: {user.masked_keys.openai}
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="password"
                                    value={openaiKey}
                                    onChange={(e) => setOpenaiKey(e.target.value)}
                                    placeholder="sk-proj-..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                            </div>

                            {/* Tavily */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Tavily Web Intelligence Key
                                    </label>
                                    {user.masked_keys?.tavily && (
                                        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                            Active: {user.masked_keys.tavily}
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="password"
                                    value={tavilyKey}
                                    onChange={(e) => setTavilyKey(e.target.value)}
                                    placeholder="tvly-..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                            </div>

                            {/* Anthropic / Claude */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Anthropic Claude Key (Optional)
                                    </label>
                                    {user.masked_keys?.anthropic && (
                                        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                            Active: {user.masked_keys.anthropic}
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="password"
                                    value={anthropicKey}
                                    onChange={(e) => setAnthropicKey(e.target.value)}
                                    placeholder="sk-ant-..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                    Update Custom Keys in Supabase
                                </button>
                            </div>
                        </form>
                    )}

                    {/* SUBSCRIPTION PLAN TAB */}
                    {activeTab === 'subscription' && (
                        <div className="space-y-4">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Current active tier persisted in Supabase: <span className="font-semibold text-indigo-600 dark:text-indigo-400 uppercase">{user.plan || 'PRO'}</span>
                            </p>

                            <div className="grid grid-cols-3 gap-3">
                                {/* Free */}
                                <div className={`p-4 rounded-xl border transition-all ${
                                    user.plan === 'free' 
                                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20' 
                                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                }`}>
                                    <div className="font-semibold text-sm text-slate-900 dark:text-white">Free Starter</div>
                                    <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">$0<span className="text-xs text-slate-500 font-normal">/mo</span></div>
                                    <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                                        <li>• 3 analyses / week</li>
                                        <li>• Standard LLM routing</li>
                                        <li>• Basic exports</li>
                                    </ul>
                                    <button
                                        onClick={() => handleSelectPlan('free')}
                                        disabled={user.plan === 'free' || isSaving}
                                        className="mt-4 w-full py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                                    >
                                        {user.plan === 'free' ? 'Current Plan' : 'Select Free'}
                                    </button>
                                </div>

                                {/* Pro */}
                                <div className={`p-4 rounded-xl border relative transition-all ${
                                    user.plan === 'pro' 
                                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20' 
                                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                }`}>
                                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm">
                                        POPULAR
                                    </span>
                                    <div className="font-semibold text-sm text-slate-900 dark:text-white">Pro Founder</div>
                                    <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">$49<span className="text-xs text-slate-500 font-normal">/mo</span></div>
                                    <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                                        <li>• Unlimited swarms</li>
                                        <li>• GPT-5.6-Luna reasoning</li>
                                        <li>• Full Tavily web access</li>
                                        <li>• Cloud synced insights</li>
                                    </ul>
                                    <button
                                        onClick={() => handleSelectPlan('pro')}
                                        disabled={user.plan === 'pro' || isSaving}
                                        className="mt-4 w-full py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {user.plan === 'pro' ? 'Current Plan' : 'Select Pro'}
                                    </button>
                                </div>

                                {/* Enterprise */}
                                <div className={`p-4 rounded-xl border transition-all ${
                                    user.plan === 'enterprise' 
                                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20' 
                                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                }`}>
                                    <div className="font-semibold text-sm text-slate-900 dark:text-white">Enterprise</div>
                                    <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">$199<span className="text-xs text-slate-500 font-normal">/mo</span></div>
                                    <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                                        <li>• Dedicated agents</li>
                                        <li>• Custom BYOK priority</li>
                                        <li>• Institutional VC exports</li>
                                        <li>• 24/7 Strategic Advisor</li>
                                    </ul>
                                    <button
                                        onClick={() => handleSelectPlan('enterprise')}
                                        disabled={user.plan === 'enterprise' || isSaving}
                                        className="mt-4 w-full py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                                    >
                                        {user.plan === 'enterprise' ? 'Current Plan' : 'Select Enterprise'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-[#0E1322] flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-mono">
                        <Database className="w-3.5 h-3.5 text-indigo-500" />
                        Project: szodeslkalqedrbmwqks
                    </span>
                    <button
                        onClick={closeSettings}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
