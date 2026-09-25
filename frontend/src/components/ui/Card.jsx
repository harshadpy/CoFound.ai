import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Card component — two density variants + optional interactive treatment.
 * density: 'compact' | 'roomy'
 * interactive: bool — adds hover border + shadow transition
 */
export function Card({ density = 'compact', interactive = false, className, children, ...props }) {
    return (
        <div
            className={cn(
                'bg-card text-card-foreground border border-border rounded-xl shadow-sm',
                density === 'compact' && 'p-4 md:p-5',
                density === 'roomy'   && 'p-6 md:p-8',
                interactive && 'hover:border-primary/30 hover:shadow-md transition-colors cursor-pointer',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }) {
    return (
        <div className={cn('flex flex-col gap-1 mb-4', className)} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ className, children, ...props }) {
    return (
        <h3 className={cn('text-base font-semibold text-foreground', className)} {...props}>
            {children}
        </h3>
    );
}

export function CardDescription({ className, children, ...props }) {
    return (
        <p className={cn('text-sm text-muted-foreground', className)} {...props}>
            {children}
        </p>
    );
}

export function CardContent({ className, children, ...props }) {
    return (
        <div className={cn('', className)} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({ className, children, ...props }) {
    return (
        <div className={cn('flex items-center mt-4 pt-4 border-t border-border', className)} {...props}>
            {children}
        </div>
    );
}
