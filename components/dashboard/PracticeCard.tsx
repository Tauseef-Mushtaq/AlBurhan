"use client";

import { Card } from "@/components/ui/Card";
import { PracticeToggle } from "@/components/ui/PracticeToggle";
import { PracticeCounter } from "@/components/ui/PracticeCounter";
import { PrayerStatusSelector } from "@/components/ui/PrayerStatusSelector";
import { togglePracticeAction } from "@/lib/practices/actions";
import { prayerStatusFromLog } from "@/lib/practices/types";

export interface PracticeCardItem {
  id: string;
  label: string;
  completed: boolean;
  value: number;
  targetValue: number;
  unit: "boolean" | "count" | "prayer";
}

export function PracticeCard({
  title,
  items,
  date,
}: {
  title: string;
  items: PracticeCardItem[];
  date: string;
}) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
          {title}
        </h3>
      </div>
      <div className="divide-y divide-border px-6">
        {items.map((item) => {
          if (item.unit === "count") {
            return (
              <PracticeCounter
                key={item.id}
                practiceItemId={item.id}
                date={date}
                label={item.label}
                value={item.value}
                targetValue={item.targetValue}
              />
            );
          }
          if (item.unit === "prayer") {
            return (
              <PrayerStatusSelector
                key={item.id}
                practiceItemId={item.id}
                date={date}
                label={item.label}
                status={prayerStatusFromLog(item.value, item.targetValue)}
              />
            );
          }
          return (
            <PracticeToggle
              key={item.id}
              label={item.label}
              completed={item.completed}
              onToggle={(next) =>
                togglePracticeAction({
                  practiceItemId: item.id,
                  date,
                  nextCompleted: next,
                })
              }
            />
          );
        })}
      </div>
    </Card>
  );
}
