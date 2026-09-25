import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
    ChevronRight,
    LogOut,
    LogIn,
    User,
    CreditCard,
    Bell,
    History,
    X,
    HelpCircle,
    Compass,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';

// ─── Shared nav-link factory ────────────────────────────────────────────────
function NavItem({ to, icon: Icon, label, end = false, collapsed, badge = null, activeDot = false }) {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                cn(
                    'group flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                    collapsed ? 'px-2 py-2 justify-center relative' : 'px-2.5 py-2',
                    isActive
                        ? 'bg-secondary text-foreground font-semibold'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
            }
            title={collapsed ? label : undefined}
        >
            {({ isActive }) => (
                <>
                    <div className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors relative',
                        isActive
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground group-hover:text-foreground'
                    )}>
                        <Icon className="w-4 h-4" aria-hidden="true" />
                        {activeDot && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary ring-2 ring-card" />
                        )}
                    </div>
                    {!collapsed && <span className="flex-1 truncate text-sm font-medium">{label}</span>}
                    {!collapsed && badge !== null && (
                        <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary/15 text-primary border border-primary/20 shrink-0">
                            {badge}
                        </span>
                    )}
                    {!collapsed && badge === null && !isActive && (
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity" aria-hidden="true" />
                    )}
                </>
            )}
        </NavLink>
    );
}

// ─── Sidebar ────────────────────────────────────────────────────────────────
export function Sidebar() {
    const { 
        user, 
        analysisResult, 
        isDark, 
        toggleDark, 
        setAnalysisInput, 
        sidebarOpen, 
        closeSidebar, 
        openHowToUse, 
        savedInsights = [], 
        toolResults = {},
        openSettings,
        fetchUserProfile,
        fetchSavedInsights,
        isAuthenticated,
        openAuthModal,
        logout
    } = useStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchUserProfile();
        fetchSavedInsights();
    }, []);

    const [showSettings, setShowSettings] = useState(false);
    const settingsRef = useRef(null);

    // Close settings dropdown on outside click
    useEffect(() => {
        function handleOutside(e) {
            if (settingsRef.current && !settingsRef.current.contains(e.target)) {
                setShowSettings(false);
            }
        }
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    // Close mobile drawer on route change
    useEffect(() => { closeSidebar(); }, []);

    const researchTools = [
        { name: 'Trend Explorer',      icon: TrendingUp, to: '/trends',      key: 'trends'      },
        { name: 'Market Gaps',         icon: Target,     to: '/market-gaps',  key: 'market-gaps'  },
        { name: 'Competitor Research', icon: GitCompare, to: '/competitors',  key: 'competitors'  },
    ];

    const SidebarContent = ({ collapsed }) => (
        <aside className={cn(
            'h-screen bg-card border-r border-border flex flex-col overflow-y-auto custom-scrollbar transition-colors duration-200',
            // Desktop sizes handled by outer wrappers; here we just fill 100%
            'w-full'
        )}>
            {/* Logo & Top Controls */}
            <div className={cn(
                'flex items-center justify-between border-b border-border',
                collapsed ? 'p-2.5 flex-col gap-2' : 'px-4 py-3'
            )}>
                <div 
                    className="flex items-center gap-2.5 cursor-pointer"
                    onClick={() => navigate('/')}
                    role="button"
                    aria-label="Go to home"
                >
                    <div className="relative w-7 h-7 shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-xs" />
                        <div className="relative flex items-center justify-center w-full h-full text-white font-bold text-sm">C</div>
                    </div>
                    {!collapsed && (
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-[16px] font-bold tracking-tight text-foreground">CoFound</span>
                            <span className="text-[16px] font-bold tracking-tight bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">.ai</span>
                        </div>
                    )}
                </div>

                {/* Dark-mode toggle moved to Top Header */}
                <button
                    onClick={toggleDark}
                    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150 shrink-0',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isDark
                            ? 'text-amber-400 hover:bg-amber-950/30 hover:text-amber-300'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                    title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {isDark ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2 py-3 space-y-3 overflow-y-auto custom-scrollbar" aria-label="Main navigation">

                {/* Agentic */}
                <div className="space-y-0.5">
                    {!collapsed && (
                        <p className="flex items-center gap-1.5 px-2 mb-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                            <Zap className="w-3 h-3" aria-hidden="true" /> Agentic
                        </p>
                    )}

                    {/* Primary CTA nav item — uniform size with all buttons */}
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            cn(
                                'group flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                                collapsed ? 'px-2 py-2 justify-center relative' : 'px-2.5 py-2',
                                isActive
                                    ? 'bg-primary text-primary-foreground font-semibold'
                                    : 'text-muted-foreground bg-primary/10 hover:bg-primary/20 hover:text-primary'
                            )
                        }
                        title={collapsed ? 'Agentic Analysis' : undefined}
                    >
                        {({ isActive }) => (
                            <>
                                <div className={cn(
                                    'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                                    isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                                )}>
                                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                                </div>
                                {!collapsed && <span className="flex-1 truncate text-sm font-medium">Agentic Analysis</span>}
                            </>
                        )}
                    </NavLink>

                    {/* View Report — when available */}
                    {analysisResult && (
                        <NavLink
                            to="/report"
                            className={({ isActive }) =>
                                cn(
                                    'group flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                                    collapsed ? 'px-2 py-2 justify-center relative' : 'px-2.5 py-2',
                                    isActive
                                        ? 'bg-emerald-600 text-white font-semibold'
                                        : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                                )
                            }
                            title={collapsed ? 'View Report' : undefined}
                        >
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <FileText className="w-4 h-4" aria-hidden="true" />
                            </div>
                            {!collapsed && (
                                <>
                                    <span className="truncate flex-1 text-sm font-medium">View Report</span>
                                    <span className="ml-auto text-[10px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full shrink-0">READY</span>
                                </>
                            )}
                        </NavLink>
                    )}

                    {/* Past Analyses */}
                    <NavItem to="/history" icon={History} label="Past Analyses" collapsed={collapsed} />
                </div>

                {/* Ideas — between autonomous and research */}
                <NavItem to="/ideas" icon={Lightbulb} label="Find Cool Ideas" collapsed={collapsed} />

                {/* Research Tools */}
                <div>
                    {!collapsed && (
                        <div className="flex items-center gap-2 px-2 mb-2">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Research Tools</span>
                            <div className="flex-1 h-px bg-border" />
                        </div>
                    )}
                    {collapsed && <div className="h-px bg-border mx-2 my-2" />}
                    <div className="space-y-0.5">
                        {researchTools.map(item => (
                            <NavItem
                                key={item.name}
                                to={item.to}
                                icon={item.icon}
                                label={item.name}
                                collapsed={collapsed}
                                activeDot={!!toolResults[item.key]?.result}
                            />
                        ))}
                    </div>
                </div>

                {/* Library & Guide */}
                <div>
                    {!collapsed && (
                        <div className="flex items-center gap-2 px-2 mb-2">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Library & Guide</span>
                            <div className="flex-1 h-px bg-border" />
                        </div>
                    )}
                    {collapsed && <div className="h-px bg-border mx-2 my-2" />}
                    <div className="space-y-0.5">
                        <NavItem
                            to="/saved"
                            icon={Bookmark}
                            label="Saved Insights"
                            collapsed={collapsed}
                            badge={savedInsights.length > 0 ? savedInsights.length : null}
                        />

                        {/* How to Use CoFound Button — exact same size, height & alignment as all nav items */}
                        <button
                            type="button"
                            onClick={openHowToUse}
                            className={cn(
                                'w-full group flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                                'text-muted-foreground hover:bg-muted hover:text-foreground',
                                collapsed ? 'px-2 py-2 justify-center relative' : 'px-2.5 py-2'
                            )}
                            title={collapsed ? 'How to Use' : undefined}
                        >
                            <div className="w-7 h-7 rounded-lg bg-muted text-muted-foreground group-hover:text-foreground group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center shrink-0 transition-colors">
                                <Compass className="w-4 h-4" aria-hidden="true" />
                            </div>
                            {!collapsed && (
                                <>
                                    <span className="flex-1 text-left truncate text-sm font-medium">How to Use</span>
                                    <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary/15 text-primary border border-primary/20 shrink-0">
                                        GUIDE
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Footer */}
            <div className={cn('p-2 border-t border-border relative', collapsed && 'flex flex-col items-center gap-1')}>
                {/* Settings dropdown */}
                {showSettings && !collapsed && (
                    <div ref={settingsRef} className="absolute bottom-[110%] left-3 w-56 bg-card rounded-xl shadow-xl border border-border overflow-hidden animate-fade-in-up z-50">
                        <div className="p-3 border-b border-border text-left">
                            <p className="font-bold text-sm text-foreground pl-1">Platform Settings</p>
                        </div>
                        <div className="p-1">
                            {[
                                { icon: User,       label: 'Account & BYOK Keys' },
                                { icon: CreditCard, label: 'Subscription Plan'  },
                                { icon: Bell,       label: 'Notifications Config' },
                            ].map(({ icon: Icon, label }) => (
                                <button 
                                    key={label} 
                                    onClick={() => { setShowSettings(false); openSettings(); }}
                                    className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                    <Icon className="w-4 h-4 text-muted-foreground" aria-hidden="true" /> {label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* User card or Sign In button based on authentication state */}
                {isAuthenticated && user ? (
                    !collapsed ? (
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-muted group transition-colors">
                            <div 
                                className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                                onClick={openSettings}
                                title="Click to open Cloud Account & Settings"
                            >
                                <div className="relative shrink-0">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                        {user.avatar || 'HP'}
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-card" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate leading-tight">{user.name}</p>
                                    <p className="text-[10px] text-muted-foreground truncate uppercase font-mono font-medium text-indigo-600 dark:text-indigo-400">
                                        {user.plan || 'PRO'} PLAN
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                    onClick={openSettings}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus-visible:ring-1 focus-visible:ring-ring"
                                    title="Settings"
                                    aria-label="Settings"
                                >
                                    <Settings className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={logout}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors focus-visible:ring-1 focus-visible:ring-rose-500"
                                    title="Log Out"
                                    aria-label="Log Out"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-1.5">
                            <button
                                onClick={openSettings}
                                className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm"
                                title="Open Cloud Settings"
                            >
                                {user.avatar || 'HP'}
                            </button>
                            <button
                                onClick={logout}
                                className="p-1 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-muted transition-colors"
                                title="Log Out"
                                aria-label="Log Out"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )
                ) : (
                    !collapsed ? (
                        <button
                            onClick={openAuthModal}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs shadow-sm hover:shadow transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Sign In / Register</span>
                        </button>
                    ) : (
                        <button
                            onClick={openAuthModal}
                            className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                            title="Sign In to CoFound"
                        >
                            <LogIn className="w-4 h-4" />
                        </button>
                    )
                )}
            </div>
        </aside>
    );

    return (
        <>
            {/* ── Desktop full sidebar (≥1024px) ──────────────────────────── */}
            <div className="hidden lg:flex w-64 h-screen fixed left-0 top-0 z-30 flex-shrink-0">
                <SidebarContent collapsed={false} />
            </div>

            {/* ── Tablet icon-rail (768–1023px) ────────────────────────────── */}
            <div className="hidden md:flex lg:hidden w-14 h-screen fixed left-0 top-0 z-30 flex-shrink-0">
                <SidebarContent collapsed={true} />
            </div>

            {/* ── Mobile drawer (<768px) ────────────────────────────────────── */}
            {/* Scrim */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
                    onClick={closeSidebar}
                    aria-hidden="true"
                />
            )}
            {/* Drawer */}
            <div className={cn(
                'fixed left-0 top-0 z-50 h-screen w-64 flex flex-col md:hidden',
                'transition-transform duration-300',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
                {/* Close button */}
                <button
                    onClick={closeSidebar}
                    aria-label="Close navigation"
                    className="absolute top-4 right-3 p-1.5 rounded-md text-muted-foreground hover:bg-muted z-10 focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <X className="w-4 h-4" aria-hidden="true" />
                </button>
                <SidebarContent collapsed={false} />
            </div>
        </>
    );
}
