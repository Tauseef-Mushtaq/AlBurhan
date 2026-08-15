"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ToastContextValue {
  /** Show a toast. Auto-dismisses after ~5s; the person can also dismiss
   * it manually. Never pass raw error objects/messages here — only
   * pre-written, localized, user-safe strings. */
  toast: (variant: ToastVariant, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-accent/30 bg-background text-foreground",
  error: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-border bg-background text-foreground",
};

const ICON_COLOR: Record<ToastVariant, string> = {
  success: "text-accent",
  error: "text-red-600",
  warning: "text-amber-600",
  info: "text-foreground/60",
};

let nextId = 1;
const AUTO_DISMISS_MS = 5000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toastFn = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = nextId++;
      setItems((prev) => [...prev, { id, variant, message }]);
      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast: toastFn }), [toastFn]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Fixed to the bottom on mobile (clear of the bottom tab bar via
       * safe spacing) and bottom-end on larger screens. Uses logical
       * `end-4` rather than `right-4` so it mirrors correctly in RTL. */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-20 z-50 flex flex-col items-center gap-2 md:inset-x-auto md:bottom-6 md:end-6 md:items-end"
      >
        {items.map((item) => {
          const Icon = ICONS[item.variant];
          return (
            <div
              key={item.id}
              role={item.variant === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg border px-4 py-3 text-sm shadow-[0_4px_16px_rgb(0,0,0,0.08)] motion-safe:animate-[toast-in_0.2s_ease-out]",
                VARIANT_STYLES[item.variant]
              )}
            >
              <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", ICON_COLOR[item.variant])} aria-hidden="true" />
              <p className="flex-1">{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss"
                className="shrink-0 rounded-md p-0.5 text-current/60 hover:text-current"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
