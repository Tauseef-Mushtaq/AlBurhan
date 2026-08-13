"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";

export function SalahRow() {
  const { t } = useLocale();
  const names = [
    t.sections.salah.names.fajr,
    t.sections.salah.names.zuhr,
    t.sections.salah.names.asr,
    t.sections.salah.names.maghrib,
    t.sections.salah.names.isha,
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      {names.map((name) => (
        <div
          key={name}
          className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-background py-8 px-4"
        >
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          <span className="font-display text-tight text-lg">{name}</span>
        </div>
      ))}
    </div>
  );
}
