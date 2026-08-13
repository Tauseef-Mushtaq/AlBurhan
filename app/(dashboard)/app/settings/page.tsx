import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { getCurrentProfile } from "@/lib/practices/queries";
import { DEFAULT_TIMEZONE } from "@/lib/date";

export default async function SettingsPage() {
  const locale = getServerLocale();
  const t = getDictionary(locale);
  const profile = await getCurrentProfile();

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-tight text-2xl font-light tracking-tight mb-8">
        {t.settingsPage.title}
      </h1>
      <SettingsForm
        initialName={profile?.name ?? ""}
        initialTimezone={profile?.timezone ?? DEFAULT_TIMEZONE}
      />
    </div>
  );
}
