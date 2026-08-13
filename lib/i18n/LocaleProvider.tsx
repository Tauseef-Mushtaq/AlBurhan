"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, localeDirection, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Dictionary } from "@/lib/i18n/types";

interface LocaleContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: Dictionary;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Persists the chosen locale to a cookie (read by the server layout on the
 * next request) and to localStorage (fast client-side fallback / future
 * sync point with a user profile). Structured so this can later be
 * replaced by a Supabase-backed user preference without touching callers.
 */
function persistLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  try {
    window.localStorage.setItem(LOCALE_COOKIE, locale);
  } catch {
    // localStorage may be unavailable (privacy mode) — cookie already covers persistence.
  }
}

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      setLocaleState(next);
      // Give instant feedback before the server re-render lands.
      document.documentElement.lang = next;
      document.documentElement.dir = localeDirection[next];
      persistLocale(next);
      router.refresh();
    },
    [locale, router]
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dir: localeDirection[locale],
      t: getDictionary(locale),
      setLocale,
    }),
    [locale, setLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}
