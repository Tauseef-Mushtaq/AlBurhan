import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { AdhkarTargetsForm } from "@/components/settings/AdhkarTargetsForm";
import { getCurrentProfile } from "@/lib/practices/queries";
import { getAdhkarTargetSettings } from "@/lib/settings/adhkarActions";
import { DEFAULT_TIMEZONE } from "@/lib/date";

export default async function SettingsPage() {
  const locale = getServerLocale();
  const t = getDictionary(locale);
  const [profile, adhkarTargets] = await Promise.all([
    getCurrentProfile(),
    getAdhkarTargetSettings(),
  ]);

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-display text-tight text-2xl font-light tracking-tight mb-2">
        {t.settingsPage.title}
      </h1>
      <SettingsForm
        initialName={profile?.name ?? ""}
        initialTimezone={profile?.timezone ?? DEFAULT_TIMEZONE}
      />
      <AdhkarTargetsForm rows={adhkarTargets} />
    </div>
  );
}
