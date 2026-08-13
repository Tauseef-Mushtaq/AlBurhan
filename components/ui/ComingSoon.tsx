"use client";

import { SectionLabel } from "@/components/ui/Card";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function ComingSoon({ title, body }: { title: string; body?: string }) {
  const { t } = useLocale();
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center px-6">
      <SectionLabel>{t.common.comingSoon}</SectionLabel>
      <h1 className="mt-3 font-display text-tight text-2xl sm:text-3xl font-light tracking-tight">
        {title}
      </h1>
      {body && <p className="mt-3 max-w-md text-sm text-muted">{body}</p>}
    </div>
  );
}
