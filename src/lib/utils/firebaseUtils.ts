/**
 * Firebase utility functions for the application
 */

import { FirebaseError, FirebaseTimestamp } from "../types/firebase";

/**
 * Converts a Firebase timestamp to a Date object
 */
export function timestampToDate(
  timestamp: FirebaseTimestamp | Date | string,
): Date {
  if (timestamp instanceof Date) {
    return timestamp;
  } else if (typeof timestamp === "string") {
    return new Date(timestamp);
  } else if (timestamp && "seconds" in timestamp) {
    return new Date(timestamp.seconds * 1000);
  }
  return new Date();
}

/**
 * Safe error handler for Firebase errors
 */
export function handleFirebaseError(error: unknown): FirebaseError {
  if (typeof error === "object" && error !== null) {
    const code = "code" in error ? String(error.code) : "unknown";
    const message =
      "message" in error ? String(error.message) : "An unknown error occurred";
    return { code, message };
  }
  return {
    code: "unknown",
    message:
      error instanceof Error ? error.message : "An unknown error occurred",
  };
}

/**
 * Determines if a habit should occur on a given date based on its frequency
 */
export function shouldHabitOccurOnDate(
  habit: {
    frequency: {
      type: "daily" | "weekly" | "monthly" | "custom";
      days?: number[];
      interval?: number;
    };
    createdAt: FirebaseTimestamp | Date | string;
  },
  date: Date,
): boolean {
  const { frequency } = habit;
  const dayOfWeek = date.getDay(); // 0-6, Sunday is 0
  const dayOfMonth = date.getDate(); // 1-31

  switch (frequency.type) {
    case "daily":
      return true;

    case "weekly":
      return frequency.days?.includes(dayOfWeek) || false;

    case "monthly":
      return frequency.days?.includes(dayOfMonth) || false;

    case "custom":
      if (!frequency.interval || frequency.interval <= 0) {
        return false;
      }

      // Calculate days since epoch for both dates
      const habitCreationDate = timestampToDate(habit.createdAt);
      const daysSinceCreation = Math.floor(
        (date.getTime() - habitCreationDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      return daysSinceCreation % frequency.interval === 0;

    default:
      return false;
  }
}
