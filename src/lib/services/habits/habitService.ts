import { BaseService, ServiceResult } from "../common/types";

export interface Habit {
  id: string;
  title: string;
  category: string;
  frequency: "Daily" | "Weekly" | "Monthly";
  selectedDays?: string[];
  date?: string;
  isCompleted: boolean;
  streak?: number;
  longestStreak?: number;
  totalCompletions?: number;
  createdAt: string | object;
  lastUpdated?: string | object;
  completedDates?: string[];
  enableReminder?: boolean;
  userId: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface HabitOccurrence {
  date: string; // ISO date string
  isCompleted: boolean;
}

export interface HabitService extends BaseService {
  // Habit CRUD operations
  getHabits(userId: string): Promise<ServiceResult<Habit[]>>;
  getHabitById(userId: string, habitId: string): Promise<ServiceResult<Habit>>;
  createHabit(
    userId: string,
    habit: Omit<Habit, "id">,
  ): Promise<ServiceResult<Habit>>;
  updateHabit(
    userId: string,
    habitId: string,
    updates: Partial<Habit>,
  ): Promise<ServiceResult<Habit>>;
  deleteHabit(userId: string, habitId: string): Promise<ServiceResult<void>>;

  // Habit completion tracking
  toggleHabitCompletion(
    userId: string,
    habitId: string,
    date: string,
    isCompleted: boolean,
  ): Promise<ServiceResult<Habit>>;
  getCompletionPercentage(
    userId: string,
    habitId: string,
    startDate: string,
    endDate: string,
  ): Promise<ServiceResult<number>>;
  getHabitOccurrences(
    userId: string,
    habitId: string,
    count?: number,
  ): Promise<ServiceResult<HabitOccurrence[]>>;

  // Category management
  getCategories(userId: string): Promise<ServiceResult<Category[]>>;
  createCategory(
    userId: string,
    category: Omit<Category, "id">,
  ): Promise<ServiceResult<Category>>;
  updateCategory(
    userId: string,
    categoryId: string,
    updates: Partial<Category>,
  ): Promise<ServiceResult<Category>>;
  deleteCategory(
    userId: string,
    categoryId: string,
  ): Promise<ServiceResult<void>>;

  // Filtering and specialized queries
  getTodayHabits(userId: string): Promise<ServiceResult<Habit[]>>;
  getHabitsByCategory(
    userId: string,
    categoryName: string,
  ): Promise<ServiceResult<Habit[]>>;
  searchHabits(userId: string, query: string): Promise<ServiceResult<Habit[]>>;
}
