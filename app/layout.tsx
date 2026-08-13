import type { Metadata, Viewport } from "next";
import "./globals.css";
// Self-hosted Urdu/Arabic font files (see lib/fonts.ts for the full
// rationale). Only the "arabic" subset + weights actually used in the
// UI are imported, matching the previous next/font/google subset
// selection. Importing these here (once, at the root layout) registers
// their @font-face rules for the whole app — nothing else needs to
// import them again.
import "@fontsource/noto-nastaliq-urdu/arabic-400.css";
import "@fontsource/noto-nastaliq-urdu/arabic-700.css";
import "@fontsource/noto-naskh-arabic/arabic-400.css";
import "@fontsource/noto-naskh-arabic/arabic-500.css";
import "@fontsource/noto-naskh-arabic/arabic-600.css";
import "@fontsource/noto-naskh-arabic/arabic-700.css";
import { fontVariables } from "@/lib/fonts";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localeDirection } from "@/lib/i18n/config";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";

export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.meta.title,
    description: dict.meta.description,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAFAF8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getServerLocale();
  const dir = localeDirection[locale];

  return (
    <html lang={locale} dir={dir} className={fontVariables}>
      <body className="min-h-screen bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-foreground"
        >
          Skip to content
        </a>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
