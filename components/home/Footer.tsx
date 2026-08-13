"use client";

import { Logo } from "@/components/ui/Logo";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function Footer() {
  const { t } = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background/60 py-10">
      <div className="container-page flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-start">
        <Logo wordmark={t.hero.eyebrow} className="text-background [&_svg]:text-sand" />
        <p className="text-sm">{t.footer.tagline}</p>
        <p className="text-xs">
          © {year} {t.hero.eyebrow}. {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
