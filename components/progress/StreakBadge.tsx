import { Flame } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { StreakResult } from "@/lib/progress/types";
import type { Dictionary } from "@/lib/i18n/types";

export function StreakBadge({
  streak,
  labels,
}: {
  streak: StreakResult;
  labels: Dictionary["progressPage"];
}) {
  return (
    <Card className="flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ivory">
        <Flame
          className={streak.currentStreak > 0 ? "h-5 w-5 text-sand" : "h-5 w-5 text-muted"}
          aria-hidden="true"
        />
      </div>
      <div>
        {streak.currentStreak > 0 ? (
          <p className="text-sm">
            <span className="font-semibold">{streak.currentStreak}</span>{" "}
            <span className="text-foreground/70">
              {labels.streakUnit} · {labels.streak}
            </span>
          </p>
        ) : (
          <p className="text-sm text-foreground/70">{labels.noStreak}</p>
        )}
      </div>
    </Card>
  );
}
