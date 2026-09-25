import React, { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle, Info, AlertTriangle, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS   = { success: CheckCircle, info: Info, warning: AlertTriangle, error: XCircle };
const STYLES  = {
    success: 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200',
    info:    'bg-card border-border text-foreground',
    warning: 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200',
    error:   'bg-destructive/10 border-destructive/30 text-destructive',
};
const ICONS_STYLE = { success: 'text-emerald-500', info: 'text-primary', warning: 'text-amber-500', error: 'text-destructive' };

function ToastItem({ id, message, variant = 'info', onDismiss }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t1 = setTimeout(() => setVisible(true), 10);
        const t2 = setTimeout(() => { setVisible(false); setTimeout(() => onDismiss(id), 300); }, 3000);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [id, onDismiss]);
    const Icon = ICONS[variant] || Info;
    return (
        <div role="status" aria-live="polite"
            className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium transition-all duration-300 ease-out',
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
                STYLES[variant]
            )}>
            <Icon className={cn('w-4 h-4 shrink-0', ICONS_STYLE[variant])} aria-hidden="true" />
            <span className="flex-1">{message}</span>
            <button onClick={() => { setVisible(false); setTimeout(() => onDismiss(id), 300); }}
                aria-label="Dismiss notification"
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded">
                <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
        </div>
    );
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const toast   = useCallback((message, variant = 'info') => {
        setToasts(prev => [...prev, { id: Date.now().toString(), message, variant }]);
    }, []);
    const dismiss = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);
    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div aria-label="Notifications" className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className="pointer-events-auto">
                        <ToastItem {...t} onDismiss={dismiss} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
    return ctx;
}
