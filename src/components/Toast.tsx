"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextValue {
  addToast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[9999] space-y-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-slide-up px-4 py-3 rounded-xl text-sm shadow-lg backdrop-blur-sm border ${
              toast.type === "success"
                ? "bg-[#0c4243]/95 text-white border-[#0c4243]"
                : toast.type === "error"
                ? "bg-[#421d24]/95 text-white border-[#421d24]"
                : "bg-white/95 text-[#292827] border-[#e3e3e2]"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
