import React from 'react';
import { Sidebar } from './Sidebar';

export function Layout({ children }) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-200">
            <Sidebar />
            {/* flex-1 so it takes remaining width; overflow-y-auto is now
                handled by the inner content area in each page component */}
            <main className="flex-1 ml-64 flex flex-col min-h-screen">
                {children}
            </main>
        </div>
    );
}
