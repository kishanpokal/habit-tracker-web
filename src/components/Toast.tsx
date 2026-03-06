"use client";

import { createContext, useContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info" | "warning";

type Toast = {
    id: string;
    type: ToastType;
    message: string;
};

type ToastContextType = {
    addToast: (type: ToastType, message: string) => void;
};

const ToastContext = createContext<ToastContextType>({ addToast: () => { } });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = Date.now().toString() + Math.random();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const icons: Record<ToastType, string> = {
        success: "✓",
        error: "✕",
        info: "ℹ",
        warning: "⚠",
    };

    const colors: Record<ToastType, string> = {
        success: "from-emerald-500 to-green-600",
        error: "from-red-500 to-rose-600",
        info: "from-blue-500 to-indigo-600",
        warning: "from-amber-500 to-orange-600",
    };

    const bgColors: Record<ToastType, string> = {
        success: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
        error: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20",
        info: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
        warning: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-xl ${bgColors[toast.type]}`}
                        style={{ animation: "toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
                    >
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${colors[toast.type]} flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-md`}>
                            {icons[toast.type]}
                        </div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex-1">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            <style jsx>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(100%) scale(0.8); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
        </ToastContext.Provider>
    );
}
