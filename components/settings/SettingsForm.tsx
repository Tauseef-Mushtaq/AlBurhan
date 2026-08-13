"use client";

import { useState, useTransition } from "react";
import { Card, SectionLabel } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { updateSettingsAction } from "@/lib/settings/actions";
import { COMMON_TIMEZONES } from "@/lib/settings/timezones";

export function SettingsForm({
  initialName,
  initialTimezone,
}: {
  initialName: string;
  initialTimezone: string;
}) {
  const { t, locale } = useLocale();
  const copy = t.settingsPage;

  const [name, setName] = useState(initialName);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      try {
        await updateSettingsAction({ name, language: locale, timezone });
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    });
  }

  // If the current timezone isn't in the curated list (e.g. set directly
  // in Supabase), still show it as a selectable option so the form
  // doesn't silently reset it.
  const timezoneOptions = COMMON_TIMEZONES.some((tz) => tz.value === timezone)
    ? COMMON_TIMEZONES
    : [{ value: timezone, label: timezone }, ...COMMON_TIMEZONES];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <SectionLabel>{copy.profileSection}</SectionLabel>
        <div className="mt-4">
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground/80">
            {copy.name}
          </label>
          <input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={copy.namePlaceholder}
            className="h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent"
          />
        </div>
      </Card>

      <Card>
        <SectionLabel>{copy.languageSection}</SectionLabel>
        <div className="mt-4">
          <LanguageSwitcher />
        </div>
      </Card>

      <Card>
        <SectionLabel>{copy.timezoneSection}</SectionLabel>
        <div className="mt-4">
          <select
            id="timezone"
            name="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-accent"
          >
            {timezoneOptions.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isPending}>
          {copy.save}
        </Button>
        {status === "saved" && <span className="text-sm text-accent">{copy.saved}</span>}
        {status === "error" && <span className="text-sm text-red-600">{copy.error}</span>}
      </div>
    </form>
  );
}
