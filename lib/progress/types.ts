import type { CategoryKey } from "@/lib/practices/types";

/**
 * A day is "successful" for streak purposes once its Day Score reaches
 * this threshold. Named constant so the rule can change in one place.
 */
export const STREAK_SUCCESS_THRESHOLD = 1;

/** Minimal per-practice shape the scoring functions need — nothing more. */
export interface ScorableLog {
  completed: boolean;
  value: number;
}

export interface ScorablePractice {
  category_id: string;
  target_value: number;
  log: ScorableLog | null;
}

export interface CategoryScore {
  categoryId: string;
  key: CategoryKey;
  name: string;
  color: string | null;
  completedCount: number;
  totalCount: number;
  /** 0–100 */
  score: number;
}

export interface DayScoreResult {
  date: string;
  /** 0–100, overall Day Score for the date. */
  score: number;
  categories: CategoryScore[];
  totalItems: number;
  completedItems: number;
}

export interface WeeklyPoint {
  date: string;
  /** Short weekday label, e.g. "Mon" — locale-aware. */
  label: string;
  score: number;
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
}
