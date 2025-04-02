/**
 * Firebase habit operations
 */
import {
  addDoc,
  collection,
  db,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
} from "../../firebase/config";
import { isSameDay } from "../../utils/dateUtils";
import {
  handleFirebaseError,
  shouldHabitOccurOnDate,
} from "../../utils/firebaseUtils";
import { generateOccurrences } from "../../utils/habitUtils";
import {
  ApiError,
  ServiceResult,
  createErrorResult,
  createSuccessResult,
} from "../common/types";
import { Habit, HabitOccurrence } from "./habitService";

/**
 * Get habits for a user
 */
export async function getHabits(
  userId: string,
): Promise<ServiceResult<Habit[]>> {
  try {
    const habitsRef = collection(db, "users", userId, "habits");
    const snapshot = await getDocs(habitsRef);

    const habits: Habit[] = [];
    snapshot.forEach(doc => {
      const habitData = doc.data() as Omit<Habit, "id">;
      habits.push({
        id: doc.id,
        ...habitData,
      });
    });

    return createSuccessResult(habits);
  } catch (error: unknown) {
    const firebaseError = handleFirebaseError(error);
    return createErrorResult(
      new ApiError(
        firebaseError.message || "Failed to fetch habits",
        firebaseError.code || "habits/unknown",
      ),
    );
  }
}

/**
 * Get a habit by ID
 */
export async function getHabitById(
  userId: string,
  habitId: string,
): Promise<ServiceResult<Habit>> {
  try {
    const habitRef = doc(db, "users", userId, "habits", habitId);
    const habitDoc = await getDoc(habitRef);

    if (!habitDoc.exists()) {
      return createErrorResult(
        new ApiError("Habit not found", "habits/not-found", 404),
      );
    }

    const habitData = habitDoc.data() as Omit<Habit, "id">;
    return createSuccessResult({
      id: habitDoc.id,
      ...habitData,
    });
  } catch (error: unknown) {
    const firebaseError = handleFirebaseError(error);
    return createErrorResult(
      new ApiError(
        firebaseError.message || "Failed to fetch habit",
        firebaseError.code || "habits/unknown",
      ),
    );
  }
}

/**
 * Create a new habit
 */
export async function createHabit(
  userId: string,
  habit: Omit<Habit, "id">,
): Promise<ServiceResult<Habit>> {
  try {
    // Check if a habit with the same title already exists in any category
    const habitsRef = collection(db, "users", userId, "habits");
    const q = query(habitsRef);
    const existingDocs = await getDocs(q);

    const existingHabitWithSameTitle = existingDocs.docs.find(doc => {
      const docData = doc.data();
      return (
        docData.title &&
        habit.title &&
        docData.title.toLowerCase() === habit.title.toLowerCase()
      );
    });

    if (existingHabitWithSameTitle) {
      const existingHabitData = existingHabitWithSameTitle.data();
      return createErrorResult(
        new ApiError(
          `A habit with the name "${habit.title}" already exists in the "${existingHabitData.category}" category`,
          "habits/duplicate-title",
          400,
        ),
      );
    }

    // Set default values for new habits
    const newHabit = {
      ...habit,
      streak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      completedDates: [],
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    };

    const docRef = await addDoc(habitsRef, newHabit);

    return createSuccessResult({
      id: docRef.id,
      ...newHabit,
    } as Habit);
  } catch (error: unknown) {
    console.error("Error creating habit", error);
    const firebaseError = handleFirebaseError(error);
    return createErrorResult(
      new ApiError(
        firebaseError.message || "Failed to create habit",
        firebaseError.code || "habits/unknown",
        400,
      ),
    );
  }
}

/**
 * Update an existing habit
 */
export async function updateHabit(
  userId: string,
  habitId: string,
  updates: Partial<Habit>,
): Promise<ServiceResult<Habit>> {
  try {
    const habitRef = doc(db, "users", userId, "habits", habitId);
    const habitDoc = await getDoc(habitRef);

    if (!habitDoc.exists()) {
      return createErrorResult(
        new ApiError("Habit not found", "habits/not-found", 404),
      );
    }

    // Check for duplicate title if title is being updated
    if (updates.title) {
      const habitsRef = collection(db, "users", userId, "habits");
      const q = query(habitsRef);
      const existingDocs = await getDocs(q);

      const existingHabitWithSameTitle = existingDocs.docs.find(doc => {
        const docData = doc.data();
        return (
          doc.id !== habitId &&
          docData.title &&
          updates.title &&
          docData.title.toLowerCase() === updates.title.toLowerCase()
        );
      });

      if (existingHabitWithSameTitle) {
        const existingHabitData = existingHabitWithSameTitle.data();
        return createErrorResult(
          new ApiError(
            `A habit with the name "${updates.title}" already exists in the "${existingHabitData.category}" category`,
            "habits/duplicate-title",
            400,
          ),
        );
      }
    }

    // Prevent certain fields from being directly updated
    const safeUpdates = { ...updates };
    delete safeUpdates.id; // ID cannot be changed
    delete safeUpdates.createdAt; // Creation date cannot be changed

    // Add last updated timestamp
    const updatedData = {
      ...safeUpdates,
      lastUpdated: serverTimestamp(),
    };

    await updateDoc(habitRef, updatedData);

    // Fetch the updated habit
    const updatedHabitDoc = await getDoc(habitRef);
    const updatedHabit = updatedHabitDoc.data() as Omit<Habit, "id">;

    return createSuccessResult({
      id: habitId,
      ...updatedHabit,
    });
  } catch (error: unknown) {
    const firebaseError = handleFirebaseError(error);
    return createErrorResult(
      new ApiError(
        firebaseError.message || "Failed to update habit",
        firebaseError.code || "habits/unknown",
        400,
      ),
    );
  }
}

/**
 * Delete a habit
 */
export async function deleteHabit(
  userId: string,
  habitId: string,
): Promise<ServiceResult<void>> {
  try {
    const habitRef = doc(db, "users", userId, "habits", habitId);
    await deleteDoc(habitRef);

    return createSuccessResult(undefined);
  } catch (error: unknown) {
    const firebaseError = handleFirebaseError(error);
    return createErrorResult(
      new ApiError(
        firebaseError.message || "Failed to delete habit",
        firebaseError.code || "habits/unknown",
      ),
    );
  }
}

/**
 * Toggle a habit's completion status for a specific date
 */
export async function toggleHabitCompletion(
  userId: string,
  habitId: string,
  date: string,
  isCompleted: boolean,
): Promise<ServiceResult<Habit>> {
  try {
    const habitRef = doc(db, "users", userId, "habits", habitId);
    const habitDoc = await getDoc(habitRef);

    if (!habitDoc.exists()) {
      return createErrorResult(
        new ApiError("Habit not found", "habits/not-found", 404),
      );
    }

    const habitData = habitDoc.data() as Habit;
    let {
      completedDates = [],
      streak = 0,
      longestStreak = 0,
      totalCompletions = 0,
    } = habitData;

    // Convert to array if it's not already (defensive coding)
    if (!Array.isArray(completedDates)) {
      completedDates = [];
    }

    // Normalize date to YYYY-MM-DD format to ensure consistency
    const normalizedDate = new Date(date).toISOString().split("T")[0];

    // Check if the date is already in the completed dates
    const dateIndex = completedDates.findIndex(
      d => new Date(d).toISOString().split("T")[0] === normalizedDate,
    );

    if (isCompleted && dateIndex === -1) {
      // Add the date if it's not already there and we're marking as completed
      completedDates.push(normalizedDate);
      totalCompletions += 1;

      // Update streak - only if it's today or yesterday (to handle completing habits late)
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];

      if (normalizedDate === today || normalizedDate === yesterday) {
        streak += 1;
        if (streak > longestStreak) {
          longestStreak = streak;
        }
      }
    } else if (!isCompleted && dateIndex !== -1) {
      // Remove the date if it's there and we're marking as not completed
      completedDates.splice(dateIndex, 1);
      if (totalCompletions > 0) {
        totalCompletions -= 1;
      }

      // Recalculate streak if necessary
      // This is simplified - a more accurate implementation would scan through all dates
      if (streak > 0) {
        streak -= 1;
      }
    }

    // Update the habit in Firestore
    await updateDoc(habitRef, {
      completedDates,
      streak,
      longestStreak,
      totalCompletions,
      lastUpdated: serverTimestamp(),
    });

    // Fetch the updated habit
    const updatedHabitDoc = await getDoc(habitRef);
    const updatedHabit = updatedHabitDoc.data() as Omit<Habit, "id">;

    return createSuccessResult({
      id: habitId,
      ...updatedHabit,
    } as Habit);
  } catch (error: unknown) {
    const firebaseError = handleFirebaseError(error);
    return createErrorResult(
      new ApiError(
        firebaseError.message || "Failed to toggle habit completion",
        firebaseError.code || "habits/unknown",
        400,
      ),
    );
  }
}

/**
 * Get habit completion percentage between two dates
 */
export async function getCompletionPercentage(
  userId: string,
  habitId: string,
  startDate: string,
  endDate: string,
): Promise<ServiceResult<number>> {
  try {
    const habitResult = await getHabitById(userId, habitId);

    if (habitResult.result === "ERROR" || !habitResult.data) {
      return createErrorResult(
        habitResult.error ||
          new ApiError("Failed to get habit", "habits/unknown"),
      );
    }

    const habit = habitResult.data;
    const completedDates = habit.completedDates || [];

    // Generate all possible dates between start and end
    const start = new Date(startDate);
    const end = new Date(endDate);
    const allDates: Date[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const currDate = new Date(d);

      // Only include dates where the habit is scheduled to occur
      const shouldOccur = shouldHabitOccurOnDate(habit as any, currDate);
      if (shouldOccur) {
        allDates.push(new Date(d));
      }
    }

    if (allDates.length === 0) {
      return createSuccessResult(0); // No scheduled occurrences in this period
    }

    // Count completed dates in this range
    const completedInRange = completedDates.filter(dateStr => {
      const completedDate = new Date(dateStr);
      return (
        completedDate >= start &&
        completedDate <= end &&
        allDates.some(d => isSameDay(d, completedDate))
      );
    });

    const percentage = (completedInRange.length / allDates.length) * 100;
    return createSuccessResult(Math.round(percentage));
  } catch (error: unknown) {
    const firebaseError = handleFirebaseError(error);
    return createErrorResult(
      new ApiError(
        firebaseError.message || "Failed to calculate completion percentage",
        firebaseError.code || "habits/unknown",
      ),
    );
  }
}

/**
 * Get habit occurrences
 */
export async function getHabitOccurrences(
  userId: string,
  habitId: string,
  count: number = 10,
  startDate: Date = new Date(),
): Promise<ServiceResult<HabitOccurrence[]>> {
  try {
    const habitResult = await getHabitById(userId, habitId);

    if (habitResult.result === "ERROR" || !habitResult.data) {
      return createErrorResult(
        habitResult.error ||
          new ApiError("Failed to get habit", "habits/unknown"),
      );
    }

    const habit = habitResult.data;

    // Generate occurrences based on habit frequency for the next 'count' days
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + count * 2); // Looking ahead further to ensure we get enough occurrences

    const habitWithType = {
      ...habit,
      frequency: {
        type: habit.frequency.toLowerCase() as
          | "daily"
          | "weekly"
          | "monthly"
          | "custom",
        days: habit.selectedDays?.map(Number) || [],
      },
    };

    const occurrences = generateOccurrences(
      startDate,
      endDate,
      habitWithType.frequency.type,
      habitWithType.frequency.days,
    ).slice(0, count);

    // Check which ones are already completed
    const completedDates = habit.completedDates || [];

    const result = occurrences.map(date => {
      const dateStr = date.toISOString().split("T")[0];
      const isCompleted = completedDates.some(completedDate => {
        const completedDateStr = new Date(completedDate)
          .toISOString()
          .split("T")[0];
        return dateStr === completedDateStr;
      });

      return {
        date: dateStr,
        isCompleted,
      };
    });

    return createSuccessResult(result);
  } catch (error: unknown) {
    const firebaseError = handleFirebaseError(error);
    return createErrorResult(
      new ApiError(
        firebaseError.message || "Failed to get habit occurrences",
        firebaseError.code || "habits/unknown",
      ),
    );
  }
}

/**
 * Get habits for today
 */
export async function getTodayHabits(
  userId: string,
): Promise<ServiceResult<Habit[]>> {
  try {
    const habitsResult = await getHabits(userId);

    if (habitsResult.result === "ERROR" || !habitsResult.data) {
      return createErrorResult(
        habitsResult.error ||
          new ApiError("Failed to fetch habits", "habits/unknown"),
      );
    }

    const today = new Date();
    const todayHabits = habitsResult.data.filter(habit =>
      shouldHabitOccurOnDate(habit as any, today),
    );

    return createSuccessResult(todayHabits);
  } catch (error: unknown) {
    const firebaseError = handleFirebaseError(error);
    return createErrorResult(
      new ApiError(
        firebaseError.message || "Failed to fetch today's habits",
        firebaseError.code || "habits/unknown",
      ),
    );
  }
}

/**
 * Get habits by category
 */
export async function getHabitsByCategory(
  userId: string,
  categoryName: string,
): Promise<ServiceResult<Habit[]>> {
  try {
    const habitsResult = await getHabits(userId);

    if (habitsResult.result === "ERROR" || !habitsResult.data) {
      return createErrorResult(
        habitsResult.error ||
          new ApiError("Failed to fetch habits", "habits/unknown"),
      );
    }

    // If "All" category, return all habits
    if (categoryName.toLowerCase() === "all") {
      return habitsResult;
    }

    // Filter habits by category
    const filteredHabits = habitsResult.data.filter(
      habit => habit.category.toLowerCase() === categoryName.toLowerCase(),
    );

    return createSuccessResult(filteredHabits);
  } catch (error: unknown) {
    const firebaseError = handleFirebaseError(error);
    return createErrorResult(
      new ApiError(
        firebaseError.message || "Failed to fetch habits by category",
        firebaseError.code || "habits/unknown",
      ),
    );
  }
}

/**
 * Search habits by query
 */
export async function searchHabits(
  userId: string,
  query: string,
): Promise<ServiceResult<Habit[]>> {
  try {
    const habitsResult = await getHabits(userId);

    if (habitsResult.result === "ERROR" || !habitsResult.data) {
      return createErrorResult(
        habitsResult.error ||
          new ApiError("Failed to fetch habits", "habits/unknown"),
      );
    }

    // If empty query, return all habits
    if (!query || query.trim() === "") {
      return habitsResult;
    }

    // Filter habits by search query (case insensitive)
    const normalizedQuery = query.toLowerCase().trim();
    const filteredHabits = habitsResult.data.filter(
      habit =>
        habit.title.toLowerCase().includes(normalizedQuery) ||
        (habit.description &&
          habit.description.toLowerCase().includes(normalizedQuery)) ||
        habit.category.toLowerCase().includes(normalizedQuery),
    );

    return createSuccessResult(filteredHabits);
  } catch (error: unknown) {
    const firebaseError = handleFirebaseError(error);
    return createErrorResult(
      new ApiError(
        firebaseError.message || "Failed to search habits",
        firebaseError.code || "habits/unknown",
      ),
    );
  }
}
