"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { locales, localeLabels } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickAway);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickAway);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t.common.language}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 h-9 text-xs font-medium tracking-wide text-foreground/80 hover:border-foreground/30 hover:text-foreground transition-colors"
      >
        <Globe className="h-3.5 w-3.5" aria-hidden="true" />
        {localeLabels[locale].short}
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute end-0 mt-2 w-40 overflow-hidden rounded-lg border border-border bg-background py-1 shadow-lg z-50 animate-fade-in"
        >
          {locales.map((code) => (
            <li key={code}>
              <button
                type="button"
                role="option"
                aria-selected={locale === code}
                onClick={() => {
                  setLocale(code);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3.5 py-2 text-sm hover:bg-ivory transition-colors",
                  locale === code ? "text-accent font-medium" : "text-foreground/80"
                )}
              >
                <span>{localeLabels[code].native}</span>
                {locale === code && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
