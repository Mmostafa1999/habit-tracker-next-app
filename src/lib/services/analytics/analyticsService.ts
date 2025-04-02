import { ServiceResult, BaseService } from "../common/types";

export interface AnalyticsEvent {
  name: string;
  userId?: string;
  timestamp?: number | Date;
  properties?: Record<string, any>;
}

export interface UserActivity {
  userId: string;
  date: string;
  habitCompletions: number;
  loginCount: number;
  newHabitsCreated: number;
  achievementsUnlocked: number;
}

export interface UserStats {
  dailyStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number;
  habitCount: number;
  mostCompletedHabit?: {
    id: string;
    name: string;
    completions: number;
  };
}

export interface AnalyticsService extends BaseService {
  // Event tracking
  trackEvent(event: AnalyticsEvent): Promise<ServiceResult<void>>;
  
  // User activity tracking
  getUserActivity(userId: string, startDate: string, endDate: string): Promise<ServiceResult<UserActivity[]>>;
  
  // User statistics
  getUserStats(userId: string): Promise<ServiceResult<UserStats>>;
  
  // Dashboard data
  getDashboardData(userId: string): Promise<ServiceResult<{
    recentActivity: UserActivity[];
    stats: UserStats;
  }>>;
  
  // Specialized analytics for habits
  getHabitCompletionAnalytics(userId: string, habitId?: string): Promise<ServiceResult<{
    byDay: Record<string, number>;
    byWeekday: Record<string, number>;
    byTime: Record<string, number>;
  }>>;
} 