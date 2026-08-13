"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function NotFound() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm text-muted">404</p>
      <h1 className="font-display text-2xl font-light tracking-tight">
        {t.errors.notFoundTitle}
      </h1>
      <p className="max-w-sm text-sm text-foreground/70">{t.errors.notFoundBody}</p>
      <Link
        href="/"
        className="mt-2 inline-flex h-10 items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
      >
        {t.errors.goHome}
      </Link>
    </div>
  );
}
