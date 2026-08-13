"use client";

import { Eye, MessageCircleOff, EarOff } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function CharacterPillars() {
  const { t } = useLocale();
  const pillars = [
    { icon: Eye, label: t.sections.character.pillars.gaze },
    { icon: MessageCircleOff, label: t.sections.character.pillars.tongue },
    { icon: EarOff, label: t.sections.character.pillars.ears },
  ];

  return (
    <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
      {pillars.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-4 rounded-lg border border-border py-10 px-6 text-center"
        >
          <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
          <span className="text-sm text-foreground/80">{label}</span>
        </div>
      ))}
    </div>
  );
}
