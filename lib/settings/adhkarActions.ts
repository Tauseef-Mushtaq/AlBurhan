"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { AdhkarTargetActionError } from "@/lib/errors";
import { getCategoriesWithItems, getUserPracticeTargetsMap } from "@/lib/practices/queries";
import { assertValidTarget, type AdhkarTargetRow } from "@/lib/settings/adhkarShared";

/**
 * Every quantitative ("count" unit) morning/evening adhkar item, joined
 * with the signed-in user's custom target if they've set one — the same
 * effective-target logic used everywhere else (custom setting, else the
 * item's built-in default), just surfaced for the settings form rather
 * than a daily log. This intentionally does NOT read daily_practice_logs
 * — settings always reflect the user's current/future target, never a
 * historical snapshot.
 */
export const getAdhkarTargetSettings = cache(async (): Promise<AdhkarTargetRow[]> => {
  const user = await getAuthUser();
  if (!user) return [];

  const [structure, targets] = await Promise.all([
    getCategoriesWithItems(),
    getUserPracticeTargetsMap(),
  ]);

  const rows: AdhkarTargetRow[] = [];
  for (const { category, items } of structure) {
    if (category.key !== "morning_dhikr" && category.key !== "evening_dhikr") continue;
    for (const item of items) {
      if (item.unit !== "count") continue;
      rows.push({
        practiceItemId: item.id,
        categoryKey: category.key,
        key: item.key,
        titleEn: item.title_en,
        titleUr: item.title_ur,
        titleAr: item.title_ar,
        defaultTarget: item.target_value,
        currentTarget: targets.get(item.id) ?? item.target_value,
      });
    }
  }
  return rows;
});

/**
 * Updates the signed-in user's own target for one adhkar item. Never
 * touches daily_practice_logs — existing logged days keep whatever
 * target_value they were created with (see attachLogsForDate and the
 * immutability trigger in 0007_adhkar_custom_targets.sql). Only the next
 * day this practice is logged will pick up the new target.
 */
export async function updateAdhkarTargetAction(input: {
  practiceItemId: string;
  targetValue: number;
}) {
  const user = await getAuthUser();
  if (!user) {
    throw new AdhkarTargetActionError("You need to be signed in to do that.");
  }

  const targetValue = assertValidTarget(input.targetValue);

  const supabase = createClient();

  // Only "count" unit items are configurable targets at all — a tampered
  // practiceItemId pointing at a boolean/prayer item, or one that doesn't
  // exist/is inactive, is rejected rather than silently accepted.
  const { data: item, error: itemError } = await supabase
    .from("practice_items")
    .select("id, unit, is_active")
    .eq("id", input.practiceItemId)
    .single();

  if (itemError || !item || !item.is_active || item.unit !== "count") {
    throw new AdhkarTargetActionError("This practice doesn't support a custom target.");
  }

  const { error } = await supabase.from("user_practice_settings").upsert(
    {
      user_id: user.id,
      practice_item_id: item.id,
      target_value: targetValue,
    },
    { onConflict: "user_id,practice_item_id" }
  );

  if (error) {
    throw new AdhkarTargetActionError("Couldn't save that target — please try again.");
  }

  revalidatePath("/app/settings");
  revalidatePath("/app");

  return { targetValue };
}
