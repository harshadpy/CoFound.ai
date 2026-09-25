import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * ErrorBanner — standardised inline error state per spec §13.
 */
export function ErrorBanner({ message, onRetry, className }) {
    return (
        <div
            role="alert"
            className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg',
                'bg-destructive/10 border border-destructive/30 text-destructive',
                className
            )}
        >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="text-sm flex-1">{message}</span>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-destructive/10 hover:bg-destructive/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    Retry
                </button>
            )}
        </div>
    );
}
