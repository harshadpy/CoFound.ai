import React from 'react';
import { Bell, HelpCircle, ChevronRight, Home } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

export function Header() {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    const breadcrumbMap = {
        'analysis': 'Analysis',
        'active': 'Active Generation',
        'report': 'Market Intelligence Report',
        'trends': 'Trend Explorer',
        'competitors': 'Competitor Research',
        'market-gaps': 'Market Gaps',
        'saved': 'Saved Insights',
        'brainstorming': 'Idea Brainstorming'
    };

    return (
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-border dark:border-slate-700 flex items-center justify-between px-8 sticky top-0 z-10 transition-colors duration-200">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Link to="/" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                    <Home className="w-4 h-4" />
                </Link>
                {pathnames.length > 0 && <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                {pathnames.map((value, index) => {
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathnames.length - 1;
                    const name = breadcrumbMap[value] || value;

                    return (
                        <div key={to} className="flex items-center gap-2">
                            <Link
                                to={to}
                                className={`transition-colors ${isLast ? 'font-semibold text-slate-900 dark:text-slate-100 pointer-events-none' : 'hover:text-slate-900 dark:hover:text-slate-100'}`}
                            >
                                {name}
                            </Link>
                            {!isLast && <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                        </div>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-all relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
                </button>
                <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-all">
                    <HelpCircle className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}
