import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Badge — semantic status badges.
 * variant: 'default' | 'go' | 'pivot' | 'kill' | 'muted' | 'violet'
 */
export function Badge({ variant = 'default', className, children, ...props }) {
    const variants = {
        default: 'bg-secondary text-secondary-foreground',
        muted:   'bg-muted text-muted-foreground',
        go:      'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
        pivot:   'bg-amber-50   dark:bg-amber-950/40   text-amber-700   dark:text-amber-300   border border-amber-200   dark:border-amber-800',
        kill:    'bg-rose-50    dark:bg-rose-950/40    text-rose-700    dark:text-rose-300    border border-rose-200    dark:border-rose-800',
        violet:  'bg-violet-50  dark:bg-violet-950/40  text-violet-700  dark:text-violet-300  border border-violet-200  dark:border-violet-800',
    };
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}
