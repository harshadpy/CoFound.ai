import React, { useState } from 'react';
import { 
    X, Mail, Lock, User, ArrowRight, Loader2, 
    Eye, EyeOff, Sparkles, CheckCircle2, Shield
} from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function AuthModal() {
    const { 
        authModalOpen, 
        closeAuthModal, 
        login,
        signup,
        user
    } = useStore();

    const [mode, setMode] = useState('login'); // 'login' | 'signup'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [migratedNotice, setMigratedNotice] = useState(null);

    if (!authModalOpen) return null;

    const isGuest = user?.is_guest;

    const handleLoginHarshad = async () => {
        setLoading(true);
        setError(null);
        setMigratedNotice(null);
        const res = await login('harshad@cofound.ai', 'FounderPassword123!', 'Harshad');
        setLoading(false);
        if (!res.success) {
            setError(res.message);
        } else if (res.migratedCount > 0) {
            setMigratedNotice(`Migrated ${res.migratedCount} items to your account!`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setMigratedNotice(null);

        const cleanEmail = email.trim();
        if (!cleanEmail || !cleanEmail.includes('@')) {
            setError('Please provide a valid email address.');
            return;
        }

        if (!password || password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        let res;
        if (mode === 'signup') {
            res = await signup(cleanEmail, password, name.trim());
        } else {
            res = await login(cleanEmail, password);
        }
        setLoading(false);

        if (!res.success) {
            setError(res.message);
        } else if (res.migratedCount > 0) {
            setMigratedNotice(`Transferred ${res.migratedCount} guest items to your account!`);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) closeAuthModal();
            }}
        >
            <div 
                className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-[#0E131F] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-labelledby="auth-modal-title"
            >
                {/* Close Button */}
                <button
                    onClick={closeAuthModal}
                    className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="p-7 sm:p-8">
                    {/* Minimalist Logo Mark */}
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-indigo-500/25 mb-3">
                            CF
                        </div>
                        <h2 id="auth-modal-title" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Supabase Cloud Auth • All Pro Features Free
                        </p>
                    </div>

                    {/* Mode Toggle (ChatGPT Style Pill Tabs) */}
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-900/90 rounded-xl mb-5 border border-slate-200/60 dark:border-slate-800/60">
                        <button
                            type="button"
                            onClick={() => { setMode('login'); setError(null); }}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                mode === 'login'
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMode('signup'); setError(null); }}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                mode === 'signup'
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Create Account
                        </button>
                    </div>

                    {/* Guest Data Migration Reassurance Banner */}
                    {isGuest && (
                        <div className="mb-5 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs flex items-start gap-2.5">
                            <Sparkles className="w-4 h-4 shrink-0 text-indigo-500 mt-0.5" />
                            <p className="leading-relaxed">
                                <strong>Guest Session Active:</strong> Your existing analyses, bookmarks, and reports will seamlessly transfer to your account.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                            {error}
                        </div>
                    )}

                    {migratedNotice && (
                        <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{migratedNotice}</span>
                        </div>
                    )}

                    {/* Minimalist Form */}
                    <form onSubmit={handleSubmit} className="space-y-3.5">
                        {mode === 'signup' && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Name (Optional)
                                </label>
                                <div className="relative">
                                    <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Alex"
                                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="founder@startup.io"
                                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Password
                                </label>
                                <span className="text-[10px] text-slate-400">Min. 6 chars</span>
                            </div>
                            <div className="relative">
                                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Sleek Dark Primary Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white dark:text-slate-100 border border-slate-800 dark:border-slate-700 font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>{mode === 'signup' ? 'Creating account...' : 'Signing in...'}</span>
                                </>
                            ) : (
                                <>
                                    <span>Continue</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative flex items-center justify-center my-5">
                        <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                        <span className="bg-white dark:bg-[#0E131F] px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider relative">
                            Or 1-Click Demo
                        </span>
                    </div>

                    {/* Quick Demo Harshad Button */}
                    <button
                        type="button"
                        onClick={handleLoginHarshad}
                        disabled={loading}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 transition-all text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">
                                HP
                            </div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                Harshad (harshad@cofound.ai)
                            </span>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                            Demo Login →
                        </span>
                    </button>
                </div>

                {/* Footer status note */}
                <div className="px-6 py-3 bg-slate-50/70 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800/80 text-center text-[11px] text-slate-400">
                    Free access tier active • No payment gateway required
                </div>
            </div>
        </div>
    );
}
