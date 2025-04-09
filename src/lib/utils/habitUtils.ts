/**
 * Habit utility functions for the application
 */

import { Habit } from "../types";
import { addDays, startOfDay } from "./dateUtils";

/**
 * Generate a list of date occurrences for a habit based on its frequency and start date
 *
 * @param startDate - The starting date for the habit
 * @param endDate - The end date to generate occurrences until
 * @param frequency - The frequency of the habit (daily, weekly, custom)
 * @param daysOfWeek - For weekly or custom frequency, the days of the week the habit occurs (0 = Sunday, 6 = Saturday)
 * @returns Array of dates representing when the habit should occur
 */
export function generateOccurrences(
  startDate: Date,
  endDate: Date,
  frequency: "daily" | "weekly" | "custom",
  daysOfWeek?: number[],
): Date[] {
  // Normalize dates to start of day for consistent comparison
  const normalizedStartDate = startOfDay(startDate);
  const normalizedEndDate = startOfDay(endDate);

  // Initialize occurrences array
  const occurrences: Date[] = [];

  // Return empty array if end date is before start date
  if (normalizedEndDate < normalizedStartDate) {
    return occurrences;
  }

  // Handle daily frequency
  if (frequency === "daily") {
    let currentDate = new Date(normalizedStartDate);

    while (currentDate <= normalizedEndDate) {
      occurrences.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }

    return occurrences;
  }

  // Handle weekly frequency
  if (frequency === "weekly") {
    // Default to Monday if not specified
    const days = daysOfWeek || [1];
    let currentDate = new Date(normalizedStartDate);

    while (currentDate <= normalizedEndDate) {
      // Add date if it's one of the selected days of the week
      if (days.includes(currentDate.getDay())) {
        occurrences.push(new Date(currentDate));
      }

      currentDate = addDays(currentDate, 1);
    }

    return occurrences;
  }

  // Handle custom frequency
  if (frequency === "custom" && daysOfWeek && daysOfWeek.length > 0) {
    let currentDate = new Date(normalizedStartDate);

    while (currentDate <= normalizedEndDate) {
      // Add date if it's one of the selected days of the week
      if (daysOfWeek.includes(currentDate.getDay())) {
        occurrences.push(new Date(currentDate));
      }

      currentDate = addDays(currentDate, 1);
    }

    return occurrences;
  }

  // Return empty array if frequency is not recognized
  return occurrences;
}

/**
 * Calculate habit completion rate
 *
 * @param totalOccurrences - Total number of occurrences
 * @param completedOccurrences - Number of completed occurrences
 * @returns Completion rate as a percentage
 */
export function calculateCompletionRate(
  totalOccurrences: number,
  completedOccurrences: number,
): number {
  if (totalOccurrences === 0) return 0;
  return Math.round((completedOccurrences / totalOccurrences) * 100);
}

/**
 * Determine the next occurrence of a habit from a given date
 *
 * @param currentDate - The reference date
 * @param frequency - The frequency of the habit
 * @param daysOfWeek - For weekly or custom frequency, the days of the week the habit occurs
 * @returns The next date the habit should occur, or null if no future occurrences
 */
export function getNextOccurrence(
  currentDate: Date,
  frequency: "daily" | "weekly" | "custom",
  daysOfWeek?: number[],
): Date | null {
  // For daily habits, it's simply the next day
  if (frequency === "daily") {
    return addDays(currentDate, 1);
  }

  // For weekly or custom, find the next day that matches the pattern
  if (
    (frequency === "weekly" || frequency === "custom") &&
    daysOfWeek &&
    daysOfWeek.length > 0
  ) {
    let nextDate = addDays(currentDate, 1);

    // Look ahead up to 7 days to find the next occurrence
    for (let i = 0; i < 7; i++) {
      if (daysOfWeek.includes(nextDate.getDay())) {
        return nextDate;
      }
      nextDate = addDays(nextDate, 1);
    }
  }

  // No future occurrences
  return null;
}

/**
 * Checks if a habit should occur on a specific date based on its frequency settings
 */
export function shouldHabitOccurOnDate(habit: Habit, date: Date): boolean {
  // For completed habits, check if the date is in completedDates
  if (habit.completedDates && habit.completedDates.length > 0) {
    const dateString = date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
    if (habit.completedDates.includes(dateString)) {
      return true;
    }
  }

  // Daily habits occur every day
  if (habit.frequency === "Daily") {
    return true;
  }

  // Weekly habits occur on specific days of the week
  if (
    habit.frequency === "Weekly" &&
    habit.selectedDays &&
    habit.selectedDays.length > 0
  ) {
    const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
      date.getDay()
    ];
    return habit.selectedDays.includes(dayOfWeek);
  }

  // Monthly habits occur on specific days of the month
  if (
    habit.frequency === "Monthly" &&
    habit.selectedDays &&
    habit.selectedDays.length > 0
  ) {
    const dayOfMonth = String(date.getDate());
    return habit.selectedDays.includes(dayOfMonth);
  }

  return false;
}

/**
 * Gets the next occurrences of a habit based on its frequency settings
 */
export function getHabitOccurrences(habit: Habit, count = 10): string[] {
  const occurrences: string[] = [];

  if (!habit) return occurrences;

  let currentDate = new Date();
  let daysAdded = 0;

  while (occurrences.length < count && daysAdded < 366) {
    if (shouldHabitOccurOnDate(habit, currentDate)) {
      occurrences.push(currentDate.toISOString().split("T")[0]); // Format as YYYY-MM-DD
    }

    currentDate = addDays(currentDate, 1);
    daysAdded++;
  }

  return occurrences;
}

/**
 * Converts a day string to its numeric equivalent (0-6, where 0 is Sunday)
 */
export function convertDayStringToNumber(day: string): number {
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return dayMap[day] || 0;
}

/**
 * Calculates the completion percentage for a list of habits due today
 */
export function getCompletionPercentage(todayHabits: Habit[]): number {
  if (!todayHabits || todayHabits.length === 0) {
    return 0;
  }

  const today = new Date().toISOString().split("T")[0]; // Format as YYYY-MM-DD
  const completedCount = todayHabits.filter(
    habit =>
      habit.isCompleted ||
      (habit.completedDates && habit.completedDates.includes(today)),
  ).length;

  return Math.round((completedCount / todayHabits.length) * 100);
}
