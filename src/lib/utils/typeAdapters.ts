/**
 * Type Adapter Utilities
 *
 * These functions help convert between different type representations
 * across the application, especially between service layer types and UI layer types.
 */

import {
  Category as ServiceCategory,
  Habit as ServiceHabit,
} from "../services/habits/habitService";
import { Category as UICategory, Habit as UIHabit } from "../types";

/**
 * Convert a service layer Habit to a UI layer Habit
 */
export function adaptServiceHabitToUIHabit(
  serviceHabit: ServiceHabit,
): UIHabit {
  // Make our best effort to map between the different fields
  return {
    id: serviceHabit.id,
    userId: serviceHabit.userId || "",
    createdAt: serviceHabit.createdAt,
    title: serviceHabit.name || "",
    category: serviceHabit.category || "",
    frequency: mapFrequencyType(serviceHabit.frequency?.type),
    selectedDays: mapSelectedDays(serviceHabit),
    date: new Date().toISOString().split("T")[0], // Default to today
    isCompleted: checkIfCompleted(serviceHabit),
    enableReminder: serviceHabit.reminderEnabled || false,
  };
}

/**
 * Convert a UI layer Habit to a service layer Habit
 */
export function adaptUIHabitToServiceHabit(
  uiHabit: UIHabit,
): Partial<ServiceHabit> {
  return {
    id: uiHabit.id,
    userId: uiHabit.userId,
    name: uiHabit.title,
    category: uiHabit.category,
    frequency: {
      type: mapFrequencyString(uiHabit.frequency),
      days: parseDaysFromString(uiHabit.selectedDays),
    },
    reminderEnabled: uiHabit.enableReminder,
    completedDates: uiHabit.isCompleted ? [uiHabit.date] : [],
    createdAt: uiHabit.createdAt,
    streak: 0,
    longestStreak: 0,
    totalCompletions: 0,
  };
}

/**
 * Convert a service layer Category to a UI layer Category
 */
export function adaptServiceCategoryToUICategory(
  serviceCategory: ServiceCategory,
): UICategory {
  return {
    id: serviceCategory.id,
    name: serviceCategory.name,
    color: serviceCategory.color,
  };
}

/**
 * Helper function to map service frequency type to UI frequency string
 */
function mapFrequencyType(type?: string): "Daily" | "Weekly" | "Monthly" {
  if (!type) return "Daily";

  switch (type.toLowerCase()) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    default:
      return "Daily";
  }
}

/**
 * Helper function to map UI frequency string to service frequency type
 */
function mapFrequencyString(
  frequency?: string,
): "daily" | "weekly" | "monthly" | "custom" {
  if (!frequency) return "daily";

  switch (frequency.toLowerCase()) {
    case "daily":
      return "daily";
    case "weekly":
      return "weekly";
    case "monthly":
      return "monthly";
    default:
      return "daily";
  }
}

/**
 * Helper function to extract selected days from service habit
 */
function mapSelectedDays(serviceHabit: ServiceHabit): string[] | undefined {
  if (!serviceHabit.frequency || !serviceHabit.frequency.days) {
    return undefined;
  }

  // Convert numeric days to string format based on frequency type
  if (serviceHabit.frequency.type === "weekly") {
    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return serviceHabit.frequency.days.map(day => {
      if (typeof day === "number" && day >= 0 && day <= 6) {
        return dayMap[day];
      }
      return String(day);
    });
  }

  // For monthly frequency, just convert to strings
  return serviceHabit.frequency.days.map(day => String(day));
}

/**
 * Helper function to parse days array from string array
 */
function parseDaysFromString(days?: string[]): number[] | undefined {
  if (!days || days.length === 0) {
    return undefined;
  }

  // If it looks like days of week
  if (
    days.some(day =>
      ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].includes(day),
    )
  ) {
    const dayMap = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    return days.map(day => {
      return dayMap[day as keyof typeof dayMap] || parseInt(day, 10);
    });
  }

  // Otherwise, try to parse as integers
  return days.map(day => parseInt(day, 10)).filter(day => !isNaN(day));
}

/**
 * Helper function to check if a habit is completed based on completedDates
 */
function checkIfCompleted(serviceHabit: ServiceHabit): boolean {
  if (
    !serviceHabit.completedDates ||
    serviceHabit.completedDates.length === 0
  ) {
    return false;
  }

  const today = new Date().toISOString().split("T")[0];
  return serviceHabit.completedDates.includes(today);
}
