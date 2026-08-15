import { AdhkarTargetActionError } from "@/lib/errors";

/**
 * Maximum a user (or admin, on a user's behalf) may set a custom target
 * to. Chosen to comfortably cover realistic personal goals (e.g. 100 or
 * 300 repetitions) while remaining far below anything that could produce
 * unreasonable data — a target of, say, 50,000 would make the daily
 * counter UI and PDF/image export meaningless, and there's no legitimate
 * personal-practice reason to need more than this. Documented here since
 * it's referenced from both actions below and the DB check constraint in
 * 0007_adhkar_custom_targets.sql (which must be kept in sync if this
 * changes).
 */
export const MAX_ADHKAR_TARGET = 1000;
export const MIN_ADHKAR_TARGET = 1;

export interface AdhkarTargetRow {
  practiceItemId: string;
  categoryKey: "morning_dhikr" | "evening_dhikr";
  key: string;
  titleEn: string;
  titleUr: string;
  titleAr: string;
  defaultTarget: number;
  currentTarget: number;
}

/**
 * Validates a target value server-side. Shared by the user-facing action
 * (lib/settings/adhkarActions.ts) and the admin action
 * (lib/admin/adhkarActions.ts) so the two can never drift apart on what
 * counts as a valid target. Lives in this non-"use server" module because
 * it's a plain synchronous function — a "use server" file is only allowed
 * to export async functions, so this (and the constants/type above)
 * cannot live alongside the actions themselves.
 */
export function assertValidTarget(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new AdhkarTargetActionError("Please enter a valid number.");
  }
  const rounded = Math.round(value);
  if (rounded !== value) {
    throw new AdhkarTargetActionError("Target must be a whole number.");
  }
  if (rounded < MIN_ADHKAR_TARGET) {
    throw new AdhkarTargetActionError(`Target must be at least ${MIN_ADHKAR_TARGET}.`);
  }
  if (rounded > MAX_ADHKAR_TARGET) {
    throw new AdhkarTargetActionError(`Target can't be more than ${MAX_ADHKAR_TARGET}.`);
  }
  return rounded;
}
