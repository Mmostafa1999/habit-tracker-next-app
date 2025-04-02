/**
 * Habit utility functions for the application
 */

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
