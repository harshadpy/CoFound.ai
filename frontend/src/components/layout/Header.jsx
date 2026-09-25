import React, { useState, useRef, useEffect } from 'react';
import {
    Bell, HelpCircle, ChevronRight, Home, Command, X,
    CheckCircle, MessageCircle, FileText, Menu
} from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

export function Header() {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter(x => x);
    const { 
        toggleSidebarOpen, 
        openHowToUse,
        notifications,
        unreadNotificationsCount,
        fetchNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        openCopilot
    } = useStore();

    const [showNotifications, setShowNotifications] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const notifRef = useRef(null);
    const helpRef  = useRef(null);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, []);

    const breadcrumbMap = {
        'analysis':        'Analysis',
        'active':          'Active Generation',
        'active-analysis': 'Active Generation',
        'report':          'Market Intelligence Report',
        'trends':          'Trend Explorer',
        'competitors':     'Competitor Research',
        'market-gaps':     'Market Gaps',
        'saved':           'Saved Insights',
        'brainstorming':   'Idea Brainstorming',
        'ideas':           'Find Cool Ideas',
        'history':         'Past Analyses',
    };

    // Global Cmd+K / Ctrl+K keyboard shortcut to open How to Use guide
    useEffect(() => {
        function handleKeyDown(e) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                openHowToUse();
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [openHowToUse]);

    useEffect(() => {
        function handleOutside(e) {
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
            if (helpRef.current  && !helpRef.current.contains(e.target))  setShowHelp(false);
        }
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    const iconBtn = cn(
        'p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
    );

    return (
        <header className="h-14 bg-card/80 dark:bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 transition-colors duration-200">

            {/* Left — hamburger (mobile only) + breadcrumbs */}
            <div className="flex items-center gap-2 text-sm min-w-0">
                {/* Hamburger — visible only on mobile */}
                <button
                    className={cn(iconBtn, 'md:hidden shrink-0')}
                    onClick={toggleSidebarOpen}
                    aria-label="Open navigation menu"
                >
                    <Menu className="w-5 h-5" aria-hidden="true" />
                </button>

                {/* Breadcrumbs */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0">
                    <Link
                        to="/"
                        aria-label="Home"
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                        <Home className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>

                    {pathnames.map((value, index) => {
                        const to   = `/${pathnames.slice(0, index + 1).join('/')}`;
                        const isLast = index === pathnames.length - 1;
                        const name = breadcrumbMap[value] || value;

                        return (
                            <React.Fragment key={to}>
                                <ChevronRight className="w-3.5 h-3.5 text-border shrink-0" aria-hidden="true" />
                                <Link
                                    to={to}
                                    aria-current={isLast ? 'page' : undefined}
                                    className={cn(
                                        'truncate max-w-[140px] md:max-w-xs transition-colors',
                                        isLast
                                            ? 'font-semibold text-foreground cursor-default'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                    onClick={isLast ? (e) => e.preventDefault() : undefined}
                                >
                                    {name}
                                </Link>
                            </React.Fragment>
                        );
                    })}
                </nav>
            </div>

            {/* Right — actions */}
            <div className="flex items-center gap-2 shrink-0">
                {/* Strategic Copilot Quick Button */}
                <button
                    onClick={openCopilot}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500/10 to-violet-500/10 hover:from-indigo-500/20 hover:to-violet-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 text-xs font-semibold shadow-xs transition-all"
                    title="Open AI Strategic Copilot"
                >
                    <MessageCircle className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="hidden sm:inline">AI Copilot</span>
                </button>

                {/* Cmd-K shortcut button to launch How to Use guide */}
                <button
                    type="button"
                    onClick={openHowToUse}
                    aria-label="Open How to Use guide (Ctrl+K or Cmd+K)"
                    title="Open How to Use Guide (Ctrl+K / Cmd+K)"
                    className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                >
                    <Command className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                    <span className="font-semibold text-[11px]">K</span>
                </button>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setShowNotifications(n => !n)}
                        aria-label={`Notifications (${unreadNotificationsCount} unread)`}
                        aria-expanded={showNotifications}
                        className={cn(iconBtn, 'relative')}
                    >
                        <Bell className="w-[18px] h-[18px]" aria-hidden="true" />
                        {unreadNotificationsCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-1 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up z-50">
                            <div className="p-3.5 border-b border-border flex justify-between items-center bg-muted/30">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">Notifications</h3>
                                    {unreadNotificationsCount > 0 && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                            {unreadNotificationsCount} new
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowNotifications(false)}
                                    aria-label="Close notifications"
                                    className="p-1 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-4 h-4" aria-hidden="true" />
                                </button>
                            </div>

                            <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar divide-y divide-border/50">
                                {notifications.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-muted-foreground">
                                        No recent notifications.
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div 
                                            key={notif.id}
                                            onClick={() => markNotificationRead(notif.id)}
                                            className={cn(
                                                "p-3 hover:bg-muted/60 rounded-xl cursor-pointer transition-colors flex gap-3 text-left",
                                                !notif.is_read && "bg-indigo-50/40 dark:bg-indigo-950/20"
                                            )}
                                        >
                                            <div className="mt-1 shrink-0">
                                                {notif.type === 'analysis_complete' ? (
                                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                ) : (
                                                    <CheckCircle className="w-4 h-4 text-indigo-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-foreground truncate">{notif.title}</p>
                                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{notif.message}</p>
                                                {notif.link && (
                                                    <Link 
                                                        to={notif.link} 
                                                        onClick={() => setShowNotifications(false)}
                                                        className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline mt-1 inline-block"
                                                    >
                                                        View Report &rarr;
                                                    </Link>
                                                )}
                                                <p className="text-[9px] text-muted-foreground mt-1">
                                                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            {!notif.is_read && (
                                                <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1" />
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {notifications.length > 0 && (
                                <div className="p-2.5 border-t border-border text-center bg-muted/20">
                                    <button 
                                        onClick={markAllNotificationsRead}
                                        className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                                    >
                                        Mark all as read
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Help */}
                <div className="relative" ref={helpRef}>
                    <button
                        onClick={() => setShowHelp(h => !h)}
                        aria-label="Help"
                        aria-expanded={showHelp}
                        className={iconBtn}
                    >
                        <HelpCircle className="w-[18px] h-[18px]" aria-hidden="true" />
                    </button>

                    {showHelp && (
                        <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-fade-in-up p-2 z-50">
                            <ul className="space-y-0.5">
                                <li>
                                    <button 
                                        onClick={() => {
                                            setShowHelp(false);
                                            openHowToUse();
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors flex items-center gap-2"
                                    >
                                        <FileText className="w-4 h-4 text-primary" aria-hidden="true" /> How to Use Guide
                                    </button>
                                </li>
                                <li>
                                    <button 
                                        onClick={() => {
                                            setShowHelp(false);
                                            openCopilot();
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors flex items-center gap-2"
                                    >
                                        <MessageCircle className="w-4 h-4 text-violet-500" aria-hidden="true" /> Strategic AI Copilot
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
