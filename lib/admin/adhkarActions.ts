"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/admin/guard";
import { getCategoriesWithItems } from "@/lib/practices/queries";
import { assertValidTarget, type AdhkarTargetRow } from "@/lib/settings/adhkarShared";
import { AdhkarTargetActionError } from "@/lib/errors";

/**
 * Every count-unit morning/evening adhkar item, joined with the given
 * user's custom target. Admin-only — the caller's role is re-checked via
 * requireAdminProfile() rather than trusted from the page that renders
 * this. Reuses the exact same "count unit + morning/evening category"
 * filtering as the user-facing getAdhkarTargetSettings so the two views
 * can never disagree about which items are configurable.
 */
export async function getAdhkarTargetSettingsForUser(userId: string): Promise<AdhkarTargetRow[]> {
  await requireAdminProfile();

  const supabase = createClient();
  const [structure, { data: settings }] = await Promise.all([
    getCategoriesWithItems(),
    supabase
      .from("user_practice_settings")
      .select("practice_item_id, target_value")
      .eq("user_id", userId),
  ]);

  const targets = new Map(
    ((settings as { practice_item_id: string; target_value: number }[]) ?? []).map((row) => [
      row.practice_item_id,
      row.target_value,
    ])
  );

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
}

/**
 * Admin sets a target on a user's behalf. Same validation and same
 * "only affects future/unlogged days" guarantee as the user's own action
 * — this never touches daily_practice_logs, so it cannot rewrite any of
 * the user's past reports. Authorization: requireAdminProfile() re-reads
 * the caller's role from the database; the target user's id is only ever
 * used as the row to upsert, never trusted for anything authorization-
 * related.
 */
export async function adminUpdateAdhkarTargetAction(input: {
  userId: string;
  practiceItemId: string;
  targetValue: number;
}) {
  await requireAdminProfile();

  const targetValue = assertValidTarget(input.targetValue);

  const supabase = createClient();

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
      user_id: input.userId,
      practice_item_id: item.id,
      target_value: targetValue,
    },
    { onConflict: "user_id,practice_item_id" }
  );

  if (error) {
    throw new AdhkarTargetActionError("Couldn't save that target — please try again.");
  }

  revalidatePath(`/admin/users/${input.userId}`);

  return { targetValue };
}
