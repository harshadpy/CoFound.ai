import React from 'react';
import { Sidebar } from './Sidebar';
import { HowToUseModal } from './HowToUseModal';
import { useStore } from '../../store/useStore';

/**
 * Layout — responsive shell.
 *  >=lg : fixed 256px sidebar + ml-64 main
 *  md   : icon-only rail (56px) + ml-14 main
 *  <md  : off-canvas drawer (sidebar hidden by default, toggled via header hamburger)
 *
 * sidebarOpen is managed in the store so Header can also toggle it.
 */
export function Layout({ children }) {
    const { howToUseOpen, closeHowToUse } = useStore();

    return (
        <div className="min-h-screen bg-background flex transition-colors duration-200">
            <Sidebar />
            {/* main content — margin compensates for sidebar at each breakpoint */}
            <main className="flex-1 flex flex-col min-h-screen w-0
                             md:ml-14
                             lg:ml-64">
                {children}
            </main>

            {/* How to Use Modal */}
            <HowToUseModal isOpen={howToUseOpen} onClose={closeHowToUse} />
        </div>
    );
}
