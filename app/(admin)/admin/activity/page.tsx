import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Card } from "@/components/ui/Card";
import { getAdminActivity } from "@/lib/admin/queries";

function relativeTime(iso: string, locale: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.round((now - then) / 1000));
  const rtf = new Intl.RelativeTimeFormat(locale === "en" ? "en" : locale, { numeric: "auto" });
  if (diffSec < 60) return rtf.format(-diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return rtf.format(-diffMin, "minute");
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return rtf.format(-diffHr, "hour");
  const diffDay = Math.round(diffHr / 24);
  return rtf.format(-diffDay, "day");
}

export default async function AdminActivityPage() {
  const locale = getServerLocale();
  const t = getDictionary(locale);
  const a = t.admin.activity;

  const activity = await getAdminActivity(40);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-tight text-2xl font-light tracking-tight text-foreground">
        {a.title}
      </h1>

      <Card className="p-0 overflow-hidden">
        {activity.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted">{a.empty}</p>
        ) : (
          <ul className="divide-y divide-border">
            {activity.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-4 px-6 py-3.5 text-sm">
                <span className="text-foreground/90">
                  <span className="font-medium">{entry.userName}</span>{" "}
                  {entry.type === "new_user" ? (
                    <span className="text-muted">{a.newUser}</span>
                  ) : (
                    <>
                      <span className={entry.completed ? "text-accent" : "text-muted"}>
                        {entry.completed ? a.completed : a.uncompleted}
                      </span>{" "}
                      <span className="text-foreground/90">{entry.itemTitle}</span>
                    </>
                  )}
                </span>
                <span className="shrink-0 text-xs text-muted">{relativeTime(entry.timestamp, locale)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
