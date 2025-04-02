/**
 * Firebase-specific type definitions
 */

export interface FirebaseError {
  code: string;
  message: string;
}

export interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
}

export interface FirestoreHabit {
  title: string;
  category: string;
  frequency: {
    type: "daily" | "weekly" | "monthly" | "custom";
    days?: number[];
    interval?: number;
  };
  streak?: number;
  longestStreak?: number;
  totalCompletions?: number;
  completedDates?: string[];
  createdAt: FirebaseTimestamp | Date | string;
  lastUpdated?: FirebaseTimestamp | Date | string;
  enableReminder?: boolean;
  userId: string;
}
