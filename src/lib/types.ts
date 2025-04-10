// Import Firebase types if needed
import { Timestamp } from "firebase/firestore";

// Habit Types
export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: string;
  frequency: string;
  timeOfDay?: string;
  completedDates: string[];
  completedCount: number;
  currentStreak: number;
  bestStreak: number;
  startDate: string | Timestamp;
  createdAt: string | Timestamp;
  userId: string;
  isActive?: boolean;
  color?: string;
  icon?: string;
}

// Achievement Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  criteria: string;
  progress: number;
  target: number;
  unlocked: boolean;
  unlockedAt?: string | Timestamp;
  icon: string;
  category: string;
  xp: number;
  secret?: boolean;
  type?: string; // Type of achievement (first_habit, habit_streak, etc.)
  color?: string;
  userId?: string;
  createdAt?: string | Timestamp;
}

// Achievement Types for UI filtering
export type AchievementFilter = "all" | "unlocked" | "locked";

// Re-export service result types for consistency
export {
  ApiError,
  createErrorResult,
  createSuccessResult,
  Result,
  ServiceResult,
} from "./services/common/types";

// Type guard for checking if a result has data
export function hasData<T>(result: { data?: T }): result is { data: T } {
  return result.data !== undefined;
}
