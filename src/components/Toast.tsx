"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastContextType = {
  addToast: (type: ToastType, message: string) => void;
};

const ToastContext = createContext<ToastContextType>({ addToast: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now().toString() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toastIcons = {
    success: <CheckCircle2 className="w-4 h-4 text-[#EAB308]" />,
    error: <AlertCircle className="w-4 h-4 text-[#A855F7]" />,
    info: <Info className="w-4 h-4 text-[#7C3AED]" />,
    warning: <AlertTriangle className="w-4 h-4 text-[#EAB308]" />,
  };

  const toastBorders = {
    success: "border-[#EAB308]/30",
    error: "border-[#A855F7]/30",
    info: "border-[#7C3AED]/30",
    warning: "border-[#EAB308]/30",
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Floating Container */}
      <div className="fixed bottom-18 sm:bottom-6 right-4 sm:right-6 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl bg-white/95 dark:bg-[#121218]/95 backdrop-blur-xl ${toastBorders[toast.type]}`}
          >
            <div className="flex-shrink-0">{toastIcons[toast.type]}</div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex-1 leading-snug">
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
