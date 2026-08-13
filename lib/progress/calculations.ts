import type { CategoryWithPractices, PracticeWithLog } from "@/lib/practices/types";
import { localizedCategoryName } from "@/lib/practices/types";
import type { Locale } from "@/lib/i18n/config";
import type { CategoryScore, DayScoreResult, ScorablePractice, StreakResult } from "@/lib/progress/types";
import { STREAK_SUCCESS_THRESHOLD } from "@/lib/progress/types";

/**
 * A single practice's contribution to a score, clamped to [0, 1].
 * Boolean practices contribute 1 or 0; quantitative practices contribute
 * value / target_value.
 */
export function practiceContribution(practice: ScorablePractice): number {
  const target = practice.target_value > 0 ? practice.target_value : 1;
  if (!practice.log) return 0;
  if (practice.log.completed) return 1;
  const raw = practice.log.value / target;
  return Math.min(1, Math.max(0, raw));
}

/** True once a logged value reaches its target — the completion rule used by the +/- counter. */
export function isPracticeComplete(value: number, targetValue: number): boolean {
  return value >= targetValue;
}

function averageContribution(practices: ScorablePractice[]): number {
  if (practices.length === 0) return 0;
  const sum = practices.reduce((acc, p) => acc + practiceContribution(p), 0);
  return Math.round((sum / practices.length) * 100);
}

/**
 * The single source of truth for the Day Score and per-category scores.
 * Consumed by Today, Progress, History, and (read-only) the homepage —
 * never reimplemented elsewhere.
 */
export function calculateDayScore(
  date: string,
  categories: CategoryWithPractices[],
  locale: Locale
): DayScoreResult {
  const allItems: PracticeWithLog[] = categories.flatMap((c) => c.items);

  const categoryScores: CategoryScore[] = categories.map((category) => ({
    categoryId: category.id,
    key: category.key,
    name: localizedCategoryName(category, locale),
    color: category.color,
    completedCount: category.items.filter((i) => i.log?.completed).length,
    totalCount: category.items.length,
    score: averageContribution(category.items),
  }));

  return {
    date,
    score: averageContribution(allItems),
    categories: categoryScores,
    totalItems: allItems.length,
    completedItems: allItems.filter((i) => i.log?.completed).length,
  };
}

/**
 * Given a chronologically-ordered (oldest → newest) list of day scores,
 * returns the current streak (ending on the last entry) and the longest
 * streak in the window. A day "counts" once its score meets
 * STREAK_SUCCESS_THRESHOLD.
 */
export function calculateStreak(dayScores: number[]): StreakResult {
  let longest = 0;
  let running = 0;
  let current = 0;

  for (let i = 0; i < dayScores.length; i++) {
    if (dayScores[i] >= STREAK_SUCCESS_THRESHOLD) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }

  // Current streak counts backward from the most recent day.
  for (let i = dayScores.length - 1; i >= 0; i--) {
    if (dayScores[i] >= STREAK_SUCCESS_THRESHOLD) {
      current += 1;
    } else {
      break;
    }
  }

  return { currentStreak: current, longestStreak: longest };
}
