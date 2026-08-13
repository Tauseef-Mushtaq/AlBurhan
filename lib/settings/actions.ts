"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLocale } from "@/lib/i18n/config";
import { SettingsActionError } from "@/lib/errors";

const KNOWN_TIMEZONES = new Set(
  typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : []
);

export async function updateSettingsAction(input: {
  name: string;
  language: string;
  timezone: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new SettingsActionError("You need to be signed in to do that.");
  }

  const name = input.name.trim();
  if (!name) {
    throw new SettingsActionError("Please enter your name.");
  }
  if (!isLocale(input.language)) {
    throw new SettingsActionError("Please choose a valid language.");
  }
  // Only validate against the known list when the runtime exposes one —
  // Intl.supportedValuesOf isn't universally available, and rejecting a
  // legitimate IANA zone on that basis would be worse than skipping the
  // check.
  if (KNOWN_TIMEZONES.size > 0 && !KNOWN_TIMEZONES.has(input.timezone)) {
    throw new SettingsActionError("Please choose a valid timezone.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ name, language: input.language, timezone: input.timezone })
    .eq("user_id", user.id);

  if (error) {
    throw new SettingsActionError("Couldn't save your settings. Please try again.");
  }

  revalidatePath("/app/settings");
  revalidatePath("/app");
  revalidatePath("/app/progress");
  revalidatePath("/app/history");
}
