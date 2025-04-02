/**
 * Date utility functions for the application
 */

/**
 * Check if two dates represent the same day
 * @param date1 - First date to compare
 * @param date2 - Second date to compare
 * @returns boolean - True if dates are the same day, false otherwise
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Format a date to display in a human-readable format (e.g., Jan 15, 2023)
 * @param date - Date to format
 * @returns string - Formatted date string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Get the start of the day (midnight) for a given date
 * @param date - Input date
 * @returns Date - Date set to the start of the day
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the end of the day (23:59:59.999) for a given date
 * @param date - Input date
 * @returns Date - Date set to the end of the day
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Add specified number of days to a date
 * @param date - Base date
 * @param days - Number of days to add (can be negative to subtract)
 * @returns Date - New date with days added
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get the start of the week (Sunday) for a given date
 * @param date - Input date
 * @returns Date - Date set to the start of the week
 */
export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay(); // 0 = Sunday, 1 = Monday, etc.
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the end of the week (Saturday) for a given date
 * @param date - Input date
 * @returns Date - Date set to the end of the week
 */
export function endOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay(); // 0 = Sunday, 1 = Monday, etc.
  result.setDate(result.getDate() + (6 - day));
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Get the start of the month for a given date
 * @param date - Input date
 * @returns Date - Date set to the start of the month
 */
export function startOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the end of the month for a given date
 * @param date - Input date
 * @returns Date - Date set to the end of the month
 */
export function endOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  result.setDate(0);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Convert a Firestore timestamp to an ISO date string
 */
export function timestampToISOString(
  timestamp: any | null | undefined
): string {
  if (!timestamp) {
    return new Date().toISOString();
  }
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  return new Date(timestamp).toISOString();
}

/**
 * Generate a server timestamp for use in document creation
 */
export function getServerTimestamp(): any {
  // Return the current date as a fallback
  // In a real implementation with Firebase, you would use Firestore's serverTimestamp()
  return new Date();
} 