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
 * Sets a quantitative practice's value for a date (e.g. the +/- counter).
 * The server clamps to [0, target] and derives `completed` from the
 * clamped value — client-side validation is a convenience only.
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

  const clampedValue = Math.min(item.target_value, Math.max(0, Math.round(input.value)));
  const completed = isPracticeComplete(clampedValue, item.target_value);

  const { error } = await supabase.from("daily_practice_logs").upsert(
    {
      user_id: user.id,
      practice_item_id: item.id,
      date: input.date,
      completed,
      value: clampedValue,
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

  return { value: clampedValue, completed };
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
