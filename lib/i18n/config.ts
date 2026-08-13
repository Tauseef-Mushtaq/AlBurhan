export const locales = ["en", "ur", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeDirection: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  ur: "rtl",
  ar: "rtl",
};

export const localeLabels: Record<Locale, { native: string; short: string }> = {
  en: { native: "English", short: "EN" },
  ur: { native: "اردو", short: "UR" },
  ar: { native: "العربية", short: "AR" },
};

/** Cookie used to persist the chosen locale across visits (pre-auth). */
export const LOCALE_COOKIE = "al_burhan_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
