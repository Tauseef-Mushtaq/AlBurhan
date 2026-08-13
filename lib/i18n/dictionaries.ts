import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/types";
import en from "@/locales/en";
import ur from "@/locales/ur";
import ar from "@/locales/ar";

const dictionaries: Record<Locale, Dictionary> = { en, ur, ar };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.en;
}
