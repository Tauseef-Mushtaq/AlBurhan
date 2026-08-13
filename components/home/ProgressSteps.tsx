"use client";

import { Fragment } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function ProgressSteps() {
  const { t } = useLocale();
  const steps = [
    t.sections.progress.steps.day,
    t.sections.progress.steps.week,
    t.sections.progress.steps.month,
    t.sections.progress.steps.journey,
  ];

  return (
    <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-x-3 gap-y-4">
      {steps.map((step, i) => (
        <Fragment key={step}>
          <span className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-foreground/80">
            {step}
          </span>
          {i < steps.length - 1 && (
            <span className="text-accent/50 rtl:rotate-180" aria-hidden="true">
              →
            </span>
          )}
        </Fragment>
      ))}
    </div>
  );
}
