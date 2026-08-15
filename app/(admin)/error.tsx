"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div
      className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center"
      role="alert"
      aria-live="assertive"
    >
      <h1 className="font-display text-xl font-light tracking-tight">
        {t.errors.genericTitle}
      </h1>
      <p className="max-w-sm text-sm text-foreground/70">{t.errors.genericBody}</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-10 items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          {t.errors.retry}
        </button>
        <Link
          href="/app"
          className="inline-flex h-10 items-center rounded-md border border-border px-5 text-sm font-medium transition-colors hover:border-foreground/40"
        >
          {t.errors.goDashboard}
        </Link>
      </div>
    </div>
  );
}
