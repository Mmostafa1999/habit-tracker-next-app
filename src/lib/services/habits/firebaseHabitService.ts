/**
 * Firebase implementation of the HabitService interface
 */
import { ServiceResult } from "../common/types";
import * as CategoryOperations from "./categoryOperations";
import * as HabitOperations from "./habitOperations";
import { Category, Habit, HabitOccurrence, HabitService } from "./habitService";

/**
 * Firebase implementation of HabitService
 * Uses modular architecture with operations split into separate files
 */
export class FirebaseHabitService implements HabitService {
  async initialize(): Promise<void> {
    // No initialization needed for Firebase
    return Promise.resolve();
  }

  // ===== Habit CRUD Operations =====

  async getHabits(userId: string): Promise<ServiceResult<Habit[]>> {
    return HabitOperations.getHabits(userId);
  }

  async getHabitById(
    userId: string,
    habitId: string,
  ): Promise<ServiceResult<Habit>> {
    return HabitOperations.getHabitById(userId, habitId);
  }

  async createHabit(
    userId: string,
    habit: Omit<Habit, "id">,
  ): Promise<ServiceResult<Habit>> {
    return HabitOperations.createHabit(userId, habit);
  }

  async updateHabit(
    userId: string,
    habitId: string,
    updates: Partial<Habit>,
  ): Promise<ServiceResult<Habit>> {
    return HabitOperations.updateHabit(userId, habitId, updates);
  }

  async deleteHabit(
    userId: string,
    habitId: string,
  ): Promise<ServiceResult<void>> {
    return HabitOperations.deleteHabit(userId, habitId);
  }

  // ===== Habit Completion Tracking =====

  async toggleHabitCompletion(
    userId: string,
    habitId: string,
    date: string,
    isCompleted: boolean,
  ): Promise<ServiceResult<Habit>> {
    return HabitOperations.toggleHabitCompletion(
      userId,
      habitId,
      date,
      isCompleted,
    );
  }

  async getCompletionPercentage(
    userId: string,
    habitId: string,
    startDate: string,
    endDate: string,
  ): Promise<ServiceResult<number>> {
    return HabitOperations.getCompletionPercentage(
      userId,
      habitId,
      startDate,
      endDate,
    );
  }

  async getHabitOccurrences(
    userId: string,
    habitId: string,
    count: number = 10,
  ): Promise<ServiceResult<HabitOccurrence[]>> {
    return HabitOperations.getHabitOccurrences(userId, habitId, count);
  }

  // ===== Category Management =====

  async getCategories(userId: string): Promise<ServiceResult<Category[]>> {
    return CategoryOperations.getCategories(userId);
  }

  async createCategory(
    userId: string,
    category: Omit<Category, "id">,
  ): Promise<ServiceResult<Category>> {
    return CategoryOperations.createCategory(userId, category);
  }

  async updateCategory(
    userId: string,
    categoryId: string,
    updates: Partial<Category>,
  ): Promise<ServiceResult<Category>> {
    return CategoryOperations.updateCategory(userId, categoryId, updates);
  }

  async deleteCategory(
    userId: string,
    categoryId: string,
  ): Promise<ServiceResult<void>> {
    return CategoryOperations.deleteCategory(userId, categoryId);
  }

  // ===== Filtering and Specialized Queries =====

  async getTodayHabits(userId: string): Promise<ServiceResult<Habit[]>> {
    return HabitOperations.getTodayHabits(userId);
  }

  async getHabitsByCategory(
    userId: string,
    categoryName: string,
  ): Promise<ServiceResult<Habit[]>> {
    return HabitOperations.getHabitsByCategory(userId, categoryName);
  }

  async searchHabits(
    userId: string,
    query: string,
  ): Promise<ServiceResult<Habit[]>> {
    return HabitOperations.searchHabits(userId, query);
  }
}
