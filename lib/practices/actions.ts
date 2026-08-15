"use server";

import { revalidatePath } from "next/cache";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { isPracticeComplete } from "@/lib/progress/calculations";
import { PracticeActionError } from "@/lib/errors";

/**
 * Loads the practice item and validates it exists and is active, so a
 * tampered practiceItemId in the browser can't be used to write against
 * something that doesn't exist. Ownership of the *log* row itself is
 * enforced independently by RLS (auth.uid() = user_id) on every write
 * below — this check only validates the practice definition.
 */
async function assertValidPracticeItem(
  supabase: ReturnType<typeof createClient>,
  practiceItemId: string
): Promise<{ id: string; target_value: number }> {
  const { data, error } = await supabase
    .from("practice_items")
    .select("id, target_value, is_active")
    .eq("id", practiceItemId)
    .single();

  if (error || !data || !data.is_active) {
    throw new PracticeActionError("This practice is no longer available.");
  }
  return data;
}

async function requireUser() {
  const user = await getAuthUser();
  if (!user) {
    throw new PracticeActionError("You need to be signed in to do that.");
  }
  return user;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Defense-in-depth format/bounds check on client-supplied dates. This is
 * intentionally loose on the "future" side (2 days) because the action
 * doesn't know the caller's IANA timezone here, and a user in a timezone
 * far ahead of the server's UTC clock can legitimately be on "tomorrow"
 * relative to UTC — the UI is what enforces "no logging future days"
 * precisely, using the profile's stored timezone. This guard exists only
 * to reject malformed strings and absurd values (e.g. a client sending
 * `9999-99-99` or a date decades away), not to be the source of truth for
 * the future-date business rule.
 */
function assertPlausibleDate(dateStr: string) {
  if (!DATE_PATTERN.test(dateStr)) {
    throw new PracticeActionError("That date isn't valid.");
  }
  const parsed = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new PracticeActionError("That date isn't valid.");
  }
  const now = Date.now();
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
  const tenYearsMs = 10 * 365 * 24 * 60 * 60 * 1000;
  if (parsed.getTime() > now + twoDaysMs) {
    throw new PracticeActionError("That date isn't valid.");
  }
  if (parsed.getTime() < now - tenYearsMs) {
    throw new PracticeActionError("That date isn't valid.");
  }
}

/**
 * A performed value can legitimately exceed its target (e.g. someone
 * raises their own bar and does 75 when the target is 50) — this is NOT
 * clamped. This sanity bound exists only to reject garbage/abusive input
 * (NaN, Infinity, absurd numbers), not to cap genuine over-performance.
 */
const MAX_SANE_PRACTICE_VALUE = 1_000_000;

/**
 * Sets a quantitative practice's value for a date (e.g. the +/- counter).
 *
 * Target resolution: if a log already exists for this (user, item, date),
 * its own target_value snapshot is authoritative and is never rewritten —
 * that's what keeps a past day's report stable even after the user later
 * changes their configured target (see 0007_adhkar_custom_targets.sql).
 * Only when creating the FIRST log row for a given day is the applicable
 * target resolved (from the user's custom setting, falling back to the
 * item's built-in default) and snapshotted.
 *
 * The performed value itself is clamped to [0, MAX_SANE_PRACTICE_VALUE]
 * only — it is deliberately NOT capped at the target, since exceeding a
 * target is valid and must be preserved exactly everywhere (dashboard,
 * history, PDF, image, CSV).
 */
export async function updatePracticeValueAction(input: {
  practiceItemId: string;
  date: string;
  value: number;
}) {
  assertPlausibleDate(input.date);
  const supabase = createClient();
  const user = await requireUser();
  const item = await assertValidPracticeItem(supabase, input.practiceItemId);

  const clampedValue = Math.min(
    MAX_SANE_PRACTICE_VALUE,
    Math.max(0, Math.round(input.value))
  );

  const { data: existing } = await supabase
    .from("daily_practice_logs")
    .select("id, target_value")
    .eq("user_id", user.id)
    .eq("practice_item_id", item.id)
    .eq("date", input.date)
    .maybeSingle();

  let targetValue: number;
  if (existing) {
    // Row already exists — its snapshot is the only source of truth for
    // this day's target. Never overwritten, regardless of what the
    // user's settings say now.
    targetValue = existing.target_value;
  } else {
    const { data: setting } = await supabase
      .from("user_practice_settings")
      .select("target_value")
      .eq("user_id", user.id)
      .eq("practice_item_id", item.id)
      .maybeSingle();
    targetValue = setting?.target_value ?? item.target_value;
  }

  const completed = isPracticeComplete(clampedValue, targetValue);

  const { error } = existing
    ? await supabase
        .from("daily_practice_logs")
        .update({
          completed,
          value: clampedValue,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq("id", existing.id)
    : await supabase.from("daily_practice_logs").insert({
        user_id: user.id,
        practice_item_id: item.id,
        date: input.date,
        completed,
        value: clampedValue,
        target_value: targetValue,
        completed_at: completed ? new Date().toISOString() : null,
      });

  if (error) {
    throw new PracticeActionError("Couldn't save that — please try again.");
  }

  revalidatePath("/app");
  revalidatePath("/app/progress");
  revalidatePath("/app/history");

  return { value: clampedValue, targetValue, completed };
}

/**
 * Toggles a boolean practice for a date, upserting into
 * daily_practice_logs. For boolean practices, completing sets
 * value = target_value; un-completing resets it to 0.
 */
export async function togglePracticeAction(input: {
  practiceItemId: string;
  date: string;
  nextCompleted: boolean;
}) {
  assertPlausibleDate(input.date);
  const supabase = createClient();
  const user = await requireUser();
  const item = await assertValidPracticeItem(supabase, input.practiceItemId);

  const { error } = await supabase.from("daily_practice_logs").upsert(
    {
      user_id: user.id,
      practice_item_id: item.id,
      date: input.date,
      completed: input.nextCompleted,
      value: input.nextCompleted ? item.target_value : 0,
      target_value: item.target_value,
      completed_at: input.nextCompleted ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,practice_item_id,date" }
  );

  if (error) {
    throw new PracticeActionError("Couldn't save that — please try again.");
  }

  revalidatePath("/app");
  revalidatePath("/app/progress");
  revalidatePath("/app/history");
}

/**
 * Sets one of the three obligatory-prayer states for a date.
 *
 * Reuses the existing (value, target_value, completed) architecture
 * rather than adding new columns:
 *   - congregation -> value = 2 (== target_value), completed = true
 *   - individual   -> value = 1,                    completed = false
 *   - missed       -> value = 0,                     completed = false
 *
 * This keeps practiceContribution() meaningful without special-casing
 * prayers: congregation scores full credit (2/2), individual scores half
 * credit (1/2), missed scores zero — a deliberate, documented product
 * decision (see PRAYER_SCORE_BEHAVIOR.md) rather than an accident of the
 * schema. `completed` (used for streak/completedCount displays) is only
 * ever true for congregation, matching how "completed" reads elsewhere
 * in the app (fully done, not partially done).
 *
 * Only valid against practice items whose unit is "prayer" — a
 * quantitative or boolean item can't be pushed into this state via a
 * tampered request, since the server re-derives value/completed from
 * `status` rather than trusting anything else the client sends.
 */
export async function setPrayerStatusAction(input: {
  practiceItemId: string;
  date: string;
  status: "congregation" | "individual" | "missed";
}) {
  assertPlausibleDate(input.date);
  const supabase = createClient();
  const user = await requireUser();

  const { data: itemData, error: itemError } = await supabase
    .from("practice_items")
    .select("id, target_value, unit, is_active")
    .eq("id", input.practiceItemId)
    .single();

  if (itemError || !itemData || !itemData.is_active || itemData.unit !== "prayer") {
    throw new PracticeActionError("This practice is no longer available.");
  }

  const value =
    input.status === "congregation"
      ? itemData.target_value
      : input.status === "individual"
        ? Math.max(0, itemData.target_value - 1)
        : 0;
  const completed = input.status === "congregation";

  const { error } = await supabase.from("daily_practice_logs").upsert(
    {
      user_id: user.id,
      practice_item_id: itemData.id,
      date: input.date,
      completed,
      value,
      target_value: itemData.target_value,
      completed_at: completed ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,practice_item_id,date" }
  );

  if (error) {
    throw new PracticeActionError("Couldn't save that — please try again.");
  }

  revalidatePath("/app");
  revalidatePath("/app/progress");
  revalidatePath("/app/history");

  return { value, completed };
}
