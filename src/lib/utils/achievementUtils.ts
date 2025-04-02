/**
 * Achievement utilities for the application
 */

import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { getAchievementService } from "../services/serviceFactory";
import { Achievement, Habit } from "../types";

/**
 * Default achievement definitions and types
 */
export type AchievementCategory =
  | "consistency"
  | "milestone"
  | "special"
  | "streak";

export type AchievementCondition = {
  type: "completions" | "streak" | "perfect_week" | "categories" | "join_date";
  threshold: number;
  timeFrame?: "day" | "week" | "month" | "all_time";
};

export const defaultAchievements = [
  {
    title: "First Step",
    description: "Complete your first habit",
    icon: "🏆",
    category: "milestone",
    condition: {
      type: "completions",
      threshold: 1,
      timeFrame: "all_time",
    },
    points: 10,
    isUnlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    title: "Consistent Beginner",
    description: "Complete 10 habit occurrences",
    icon: "🌱",
    category: "consistency",
    condition: {
      type: "completions",
      threshold: 10,
      timeFrame: "all_time",
    },
    points: 25,
    isUnlocked: false,
    progress: 0,
    maxProgress: 10,
  },
  {
    title: "Habit Master",
    description: "Complete 100 habit occurrences",
    icon: "🔥",
    category: "consistency",
    condition: {
      type: "completions",
      threshold: 100,
      timeFrame: "all_time",
    },
    points: 100,
    isUnlocked: false,
    progress: 0,
    maxProgress: 100,
  },
  {
    title: "Week Warrior",
    description: "Complete all habits for 7 consecutive days",
    icon: "📅",
    category: "streak",
    condition: {
      type: "streak",
      threshold: 7,
    },
    points: 50,
    isUnlocked: false,
    progress: 0,
    maxProgress: 7,
  },
  {
    title: "Month Champion",
    description: "Complete all habits for 30 consecutive days",
    icon: "🏅",
    category: "streak",
    condition: {
      type: "streak",
      threshold: 30,
    },
    points: 200,
    isUnlocked: false,
    progress: 0,
    maxProgress: 30,
  },
  {
    title: "Diversifier",
    description: "Create habits in 3 different categories",
    icon: "🌈",
    category: "special",
    condition: {
      type: "categories",
      threshold: 3,
    },
    points: 30,
    isUnlocked: false,
    progress: 0,
    maxProgress: 3,
  },
];

/**
 * Get achievement progress text
 * @param achievement - The achievement to get progress text for
 * @returns A string representing the achievement's progress
 */
export function getAchievementProgressText(achievement: Achievement): string {
  if (achievement.unlocked) {
    return "Completed!";
  }

  return `${achievement.progress}/${achievement.target}`;
}

/**
 * Calculate achievement progress percentage
 * @param achievement - The achievement to calculate progress for
 * @returns A number between 0 and 100 representing the percentage of completion
 */
export function getAchievementProgressPercentage(
  achievement: Achievement,
): number {
  if (achievement.unlocked) {
    return 100;
  }

  if (achievement.target > 0) {
    return Math.min(
      100,
      Math.round((achievement.progress / achievement.target) * 100),
    );
  }

  return 0;
}

/**
 * Initializes default achievements for a new user
 */
export async function initializeAchievements(userId: string): Promise<void> {
  // Direct implementation since the method isn't in the interface
  const db = getFirestore();
  const achievementsCollection = collection(
    db,
    "users",
    userId,
    "achievements",
  );

  // Check if achievements already exist
  const existingAchievements = await getDocs(
    query(achievementsCollection, where("userId", "==", userId)),
  );
  if (!existingAchievements.empty) return;

  // Default achievements to create for Firebase
  const firebaseDefaultAchievements = [
    {
      title: "First Habit",
      description: "Create your first habit",
      type: "first_habit",
      icon: "🚀",
      condition: 1,
      progress: 0,
      unlocked: false,
      color: "#E50046",
      userId: userId,
      createdAt: Timestamp.now(),
    },
    {
      title: "Consistency Streak",
      description: "Maintain a 7-day streak",
      type: "habit_streak",
      icon: "🔥",
      condition: 7,
      progress: 0,
      unlocked: false,
      color: "#F59E0B",
      userId: userId,
      createdAt: Timestamp.now(),
    },
    {
      title: "Habit Master",
      description: "Complete 50 habits",
      type: "habits_completed",
      icon: "🏆",
      condition: 50,
      progress: 0,
      unlocked: false,
      color: "#3B82F6",
      userId: userId,
      createdAt: Timestamp.now(),
    },
  ];

  // Add each achievement to the collection
  for (const achievement of firebaseDefaultAchievements) {
    await addDoc(achievementsCollection, achievement);
  }
}

/**
 * Processes achievements based on user habits and updates achievement status
 */
export async function processAchievements(
  userId: string,
  achievements: Achievement[],
  habits: Habit[],
): Promise<void> {
  // Use checkHabitAchievements method which exists in the interface
  const achievementService = getAchievementService();

  // For each habit, check if it triggers achievements
  for (const habit of habits) {
    await achievementService.checkHabitAchievements(userId, habit.id, {
      habits: habits,
      currentHabit: habit,
    });
  }
}

/**
 * Synchronizes achievements with habit data from Firestore
 * Calculates detailed metrics for each achievement type
 *
 * @param userId - The user ID
 * @param habits - Array of habits
 * @param achievements - Array of achievements
 * @returns Promise with updated achievements
 */
export async function syncAchievementsWithHabits(
  userId: string,
  habits: Habit[],
  achievements: Achievement[],
): Promise<Achievement[]> {
  if (!userId || !habits.length || !achievements.length) {
    return achievements;
  }

  // Get achievement service
  const achievementService = getAchievementService();
  const updatedAchievements: Achievement[] = [...achievements];

  try {
    // Calculate all needed metrics from habits
    const metrics = {
      totalCompletions: habits.reduce(
        (sum, habit) => sum + (habit.completedCount || 0),
        0,
      ),
      maxStreak: Math.max(...habits.map(habit => habit.currentStreak || 0), 0),
      maxLifetimeStreak: Math.max(
        ...habits.map(habit => habit.bestStreak || 0),
        0,
      ),
      totalHabits: habits.length,
      uniqueCategories: new Set(habits.map(habit => habit.category)).size,
      dailyHabits: habits.filter(habit => habit.frequency === "daily").length,
      weeklyHabits: habits.filter(habit => habit.frequency === "weekly").length,
      monthlyHabits: habits.filter(habit => habit.frequency === "monthly")
        .length,
      // Calculate "perfect weeks" where all habits were completed
      perfectWeeks: calculatePerfectWeeks(habits),
      oldestHabitAge: calculateOldestHabitAge(habits),
    };

    // Process each achievement
    for (const achievement of updatedAchievements) {
      // Skip already unlocked achievements
      if (achievement.unlocked) continue;

      let newProgress = 0;
      const achievementType = achievement.type;

      // Calculate progress based on achievement type
      switch (achievementType) {
        case "first_habit":
          newProgress = habits.length > 0 ? 1 : 0;
          break;

        case "habits_completed":
          newProgress = metrics.totalCompletions;
          break;

        case "habit_streak":
          newProgress = metrics.maxStreak;
          break;

        case "lifetime_streak":
          newProgress = metrics.maxLifetimeStreak;
          break;

        case "categories":
          newProgress = metrics.uniqueCategories;
          break;

        case "total_habits":
          newProgress = metrics.totalHabits;
          break;

        case "perfect_week":
          newProgress = metrics.perfectWeeks;
          break;

        case "habit_age":
          newProgress = metrics.oldestHabitAge;
          break;

        case "daily_habits":
          newProgress = metrics.dailyHabits;
          break;

        case "weekly_habits":
          newProgress = metrics.weeklyHabits;
          break;

        case "monthly_habits":
          newProgress = metrics.monthlyHabits;
          break;
      }

      // Update achievement if progress has changed
      if (newProgress !== achievement.progress) {
        // Check if achievement should be unlocked
        const shouldUnlock = newProgress >= achievement.target;
        
        // Only update in Firestore if there's a change
        await achievementService.updateAchievementProgress(userId, achievement.id, newProgress);
        
        // Update the local copy
        achievement.progress = newProgress;
        
        if (shouldUnlock && !achievement.unlocked) {
          await achievementService.unlockAchievement(userId, achievement.id);
          achievement.unlocked = true;
        }
      }
    }

    return updatedAchievements;
  } catch (error) {
    console.error("Error syncing achievements with habits:", error);
    return achievements;
  }
}

/**
 * Calculate the number of perfect weeks (where all scheduled habits were completed)
 */
function calculatePerfectWeeks(habits: Habit[]): number {
  // For simplicity, we'll use a basic approximation
  // A more sophisticated implementation would check each week's scheduled vs completed habits
  const completionRates = habits.map(habit => {
    const totalPossible = calculateTotalPossibleCompletions(habit);
    return totalPossible > 0 ? habit.completedCount / totalPossible : 0;
  });

  // If average completion rate is high, estimate perfect weeks based on that
  const averageCompletionRate =
    completionRates.reduce((sum, rate) => sum + rate, 0) /
    Math.max(completionRates.length, 1);

  // Rough estimate - for a more accurate calculation, we'd need to check each week's data
  return Math.floor(averageCompletionRate * 4); // Rough estimate of perfect weeks
}

/**
 * Calculate rough estimate of total possible completions for a habit
 */
function calculateTotalPossibleCompletions(habit: Habit): number {
  if (!habit.startDate) return 0;

  // Convert startDate to Date object if it's a Timestamp
  const startDate =
    typeof habit.startDate === "string"
      ? new Date(habit.startDate)
      : habit.startDate.toDate();

  // Calculate days since habit started
  const today = new Date();
  const daysSinceStart = Math.floor(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysSinceStart <= 0) return 0;

  // Calculate based on frequency
  if (habit.frequency === "daily") {
    return daysSinceStart;
  } else if (habit.frequency === "weekly") {
    // Assuming habit occurs once per week for simplicity
    return Math.floor(daysSinceStart / 7);
  } else if (habit.frequency === "monthly") {
    // Assuming habit occurs once per month for simplicity
    return Math.floor(daysSinceStart / 30);
  }

  return 0;
}

/**
 * Calculate the age of the oldest habit in days
 */
function calculateOldestHabitAge(habits: Habit[]): number {
  if (!habits.length) return 0;

  // Find the oldest habit by createdAt date
  const oldestDate = habits.reduce((oldest, habit) => {
    const habitDate =
      typeof habit.createdAt === "string"
        ? new Date(habit.createdAt)
        : habit.createdAt.toDate();

    return habitDate < oldest ? habitDate : oldest;
  }, new Date());

  // Calculate days since oldest habit
  const today = new Date();
  return Math.floor(
    (today.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24),
  );
}
