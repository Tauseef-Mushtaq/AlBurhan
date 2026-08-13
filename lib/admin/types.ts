import type { CategoryScore } from "@/lib/progress/types";

export interface AdminOverviewStats {
  totalUsers: number;
  activeToday: number;
  activeThisWeek: number;
  practicesCompletedToday: number;
  avgDayScoreToday: number;
  weeklyActivity: AdminActivityPoint[];
  categoryCompletion: AdminCategoryStat[];
}

export interface AdminActivityPoint {
  date: string;
  label: string;
  activeUsers: number;
  completions: number;
  avgScore: number;
}

export interface AdminCategoryStat {
  categoryId: string;
  name: string;
  color: string | null;
  completionRate: number;
}

export interface AdminUserRow {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: "user" | "admin";
  timezone: string;
  createdAt: string;
  lastActivity: string | null;
}

export interface AdminUserListResult {
  users: AdminUserRow[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface AdminUserDetail {
  profile: {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: "user" | "admin";
    timezone: string;
    createdAt: string;
  };
  currentStreak: number;
  avgDayScore7: number;
  avgDayScore30: number;
  completionToday: number;
  categoryPerformance: CategoryScore[];
  recentDayScores: { date: string; label: string; score: number }[];
  recentActivity: AdminActivityEntry[];
}

export interface AdminActivityEntry {
  id: string;
  type: "practice" | "new_user";
  userName: string;
  userId: string;
  itemTitle?: string;
  categoryName?: string;
  completed?: boolean;
  timestamp: string;
}

export interface AdminAnalytics {
  userGrowth7: AdminGrowthPoint[];
  userGrowth30: AdminGrowthPoint[];
  practiceActivity7: AdminActivityPoint[];
  practiceActivity30: AdminActivityPoint[];
  dayScoreTrend7: { date: string; label: string; score: number }[];
  dayScoreTrend30: { date: string; label: string; score: number }[];
  categoryCompletion: AdminCategoryStat[];
}

export interface AdminGrowthPoint {
  date: string;
  label: string;
  newUsers: number;
  totalUsers: number;
}

export interface AdminReportData {
  startDate: string;
  endDate: string;
  totalUsers: number;
  activeUsers: number;
  practiceCompletions: number;
  avgDayScore: number;
  categoryCompletion: AdminCategoryStat[];
}
