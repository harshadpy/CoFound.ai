import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Shared Button component — four variants as per design spec §8.
 * variant: 'primary' | 'secondary' | 'ghost' | 'destructive'
 * size:    'sm' | 'md' | 'lg' | 'icon'
 */
export function Button({
    variant = 'primary',
    size = 'md',
    className,
    children,
    disabled,
    ...props
}) {
    const base = [
        'inline-flex items-center justify-center gap-2 font-semibold rounded-lg',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    ].join(' ');

    const variants = {
        primary:     'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]',
        secondary:   'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:       'text-muted-foreground hover:text-foreground hover:bg-muted rounded-md',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    };

    const sizes = {
        sm:   'px-3 py-1.5 text-xs',
        md:   'px-4 py-2 text-sm',
        lg:   'px-6 py-3 text-sm',
        icon: 'p-2.5',
    };

    return (
        <button
            disabled={disabled}
            className={cn(base, variants[variant], sizes[size], className)}
            {...props}
        >
            {children}
        </button>
    );
}
