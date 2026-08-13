import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { CategoryWithPractices } from "@/lib/practices/types";
import { localizedCategoryName, localizedItemTitle, prayerStatusFromLog } from "@/lib/practices/types";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

/**
 * Purely presentational, read-only view of a past day's practices.
 * Never writes to daily_practice_logs — opening History must not create
 * or alter records.
 */
export function HistoryPracticeList({
  categories,
  locale,
}: {
  categories: CategoryWithPractices[];
  locale: Locale;
}) {
  const prayerLabels = getDictionary(locale).dashboard.prayer;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {categories.map((category) => (
        <Card key={category.id} className="p-0 overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
              {localizedCategoryName(category, locale)}
            </h3>
          </div>
          <div className="divide-y divide-border px-6">
            {category.items.map((item) => {
              const completed = item.log?.completed ?? false;
              const value = item.log?.value ?? 0;
              const prayerStatus =
                item.unit === "prayer" ? prayerStatusFromLog(value, item.target_value) : null;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 py-3 text-sm"
                >
                  <span className={completed ? "text-foreground" : "text-foreground/70"}>
                    {localizedItemTitle(item, locale)}
                  </span>
                  {item.unit === "count" ? (
                    <span className="shrink-0 tabular-nums text-foreground/70">
                      {value} / {item.target_value}
                    </span>
                  ) : item.unit === "prayer" && prayerStatus ? (
                    <span
                      className={
                        prayerStatus === "congregation"
                          ? "shrink-0 text-xs font-medium text-accent"
                          : prayerStatus === "individual"
                            ? "shrink-0 text-xs font-medium text-foreground/60"
                            : "shrink-0 text-xs font-medium text-red-600"
                      }
                    >
                      {prayerLabels[prayerStatus]}
                    </span>
                  ) : completed ? (
                    <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  ) : (
                    <X className="h-4 w-4 shrink-0 text-foreground/30" aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
