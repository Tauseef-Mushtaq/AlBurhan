import { cookies } from "next/headers";
import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

/** Reads the persisted locale cookie on the server so the initial HTML
 * already has the correct `lang`/`dir`, avoiding a flash of the wrong
 * direction. Falls back to the default locale. */
export function getServerLocale(): Locale {
  const stored = cookies().get(LOCALE_COOKIE)?.value;
  return isLocale(stored) ? stored : defaultLocale;
}
