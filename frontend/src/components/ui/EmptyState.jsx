import React from 'react';
import { cn } from '../../lib/utils';

/**
 * EmptyState — consistent empty screen pattern per spec §13.
 */
export function EmptyState({ icon: Icon, title, description, action, className }) {
    return (
        <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
            {Icon && (
                <div className="mb-4 p-3 rounded-full bg-muted">
                    <Icon className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
                </div>
            )}
            {title && (
                <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
            )}
            {description && (
                <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
            )}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}
