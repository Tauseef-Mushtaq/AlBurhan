"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function AuthCard({
  title,
  subtitle,
  children,
  switchPrompt,
  switchCta,
  switchHref,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  switchPrompt: string;
  switchCta: string;
  switchHref: string;
}) {
  const { t } = useLocale();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-warm px-6 py-16">
      <div className="absolute inset-x-0 top-0 flex h-20 items-center justify-between container-page">
        <Logo wordmark={t.hero.eyebrow} />
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-tight text-2xl sm:text-3xl font-light tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
        </div>

        <div className="rounded-lg border border-border bg-background p-6 sm:p-8">{children}</div>

        <p className="mt-6 text-center text-sm text-muted">
          {switchPrompt}{" "}
          <Link href={switchHref} className="font-medium text-accent hover:underline">
            {switchCta}
          </Link>
        </p>
      </div>
    </div>
  );
}

export function AuthField({
  id,
  label,
  type = "text",
}: {
  id: string;
  label: string;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground/80">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={type === "password" ? "current-password" : "on"}
        className="h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent"
      />
    </div>
  );
}
