import {
  collection,
  db,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "../../firebase/config";
import { Achievement, Habit } from "../../types";
import {
  ApiError,
  ServiceResult,
  createErrorResult,
  createSuccessResult,
} from "../common/types";
import { AchievementService } from "./achievementService";

export class FirebaseAchievementService implements AchievementService {
  async initialize(): Promise<void> {
    // No initialization needed
    return Promise.resolve();
  }

  async getAchievements(userId: string): Promise<ServiceResult<Achievement[]>> {
    try {
      const achievementsRef = collection(db, "users", userId, "achievements");
      const snapshot = await getDocs(achievementsRef);

      if (snapshot.empty) {
        // If no achievements exist, create the defaults
        await this.initializeDefaultAchievements(userId);

        // Fetch again after initialization
        const newSnapshot = await getDocs(achievementsRef);
        const achievements: Achievement[] = [];

        newSnapshot.forEach(doc => {
          achievements.push({
            id: doc.id,
            ...(doc.data() as Omit<Achievement, "id">),
          });
        });

        return createSuccessResult(achievements);
      }

      const achievements: Achievement[] = [];
      snapshot.forEach(doc => {
        achievements.push({
          id: doc.id,
          ...(doc.data() as Omit<Achievement, "id">),
        });
      });

      return createSuccessResult(achievements);
    } catch (error: any) {
      return createErrorResult(
        new ApiError(
          error.message || "Failed to fetch achievements",
          error.code || "achievements/unknown",
        ),
      );
    }
  }

  async getAchievementById(
    userId: string,
    achievementId: string,
  ): Promise<ServiceResult<Achievement>> {
    try {
      const achievementRef = doc(
        db,
        "users",
        userId,
        "achievements",
        achievementId,
      );
      const achievementDoc = await getDoc(achievementRef);

      if (!achievementDoc.exists()) {
        return createErrorResult(
          new ApiError("Achievement not found", "achievements/not-found", 404),
        );
      }

      const achievement = {
        id: achievementDoc.id,
        ...(achievementDoc.data() as Omit<Achievement, "id">),
      };

      return createSuccessResult(achievement);
    } catch (error: any) {
      return createErrorResult(
        new ApiError(
          error.message || "Failed to fetch achievement",
          error.code || "achievements/unknown",
        ),
      );
    }
  }

  async updateAchievementProgress(
    userId: string,
    achievementId: string,
    progress: number,
  ): Promise<ServiceResult<Achievement>> {
    try {
      const achievementRef = doc(
        db,
        "users",
        userId,
        "achievements",
        achievementId,
      );
      const achievementDoc = await getDoc(achievementRef);

      if (!achievementDoc.exists()) {
        return createErrorResult(
          new ApiError("Achievement not found", "achievements/not-found", 404),
        );
      }

      const achievement = achievementDoc.data() as Achievement;

      // Don't update if already unlocked
      if (achievement.unlocked) {
        return createSuccessResult({
          id: achievementId,
          ...achievement,
        });
      }

      // Validate progress (prevent negative values)
      const newProgress = Math.max(0, progress);
      const updates: Partial<Achievement> = { progress: newProgress };

      // Check if this update unlocks the achievement
      if (newProgress >= achievement.target && !achievement.unlocked) {
        updates.unlocked = true;
        updates.unlockedAt = serverTimestamp();
      }

      await updateDoc(achievementRef, updates);

      // Get the updated achievement
      const updatedDoc = await getDoc(achievementRef);
      const updatedAchievement = {
        id: achievementId,
        ...(updatedDoc.data() as Omit<Achievement, "id">),
      };

      return createSuccessResult(updatedAchievement);
    } catch (error: any) {
      return createErrorResult(
        new ApiError(
          error.message || "Failed to update achievement progress",
          error.code || "achievements/unknown",
        ),
      );
    }
  }

  async unlockAchievement(
    userId: string,
    achievementId: string,
  ): Promise<ServiceResult<Achievement>> {
    try {
      const achievementRef = doc(
        db,
        "users",
        userId,
        "achievements",
        achievementId,
      );
      const achievementDoc = await getDoc(achievementRef);

      if (!achievementDoc.exists()) {
        return createErrorResult(
          new ApiError("Achievement not found", "achievements/not-found", 404),
        );
      }

      const achievement = achievementDoc.data() as Achievement;

      // Don't update if already unlocked
      if (achievement.unlocked) {
        return createSuccessResult({
          id: achievementId,
          ...achievement,
        });
      }

      // Set as unlocked and set progress to target
      await updateDoc(achievementRef, {
        unlocked: true,
        unlockedAt: serverTimestamp(),
        progress: achievement.target,
      });

      // Get the updated achievement
      const updatedDoc = await getDoc(achievementRef);
      const updatedAchievement = {
        id: achievementId,
        ...(updatedDoc.data() as Omit<Achievement, "id">),
      };

      return createSuccessResult(updatedAchievement);
    } catch (error: any) {
      return createErrorResult(
        new ApiError(
          error.message || "Failed to unlock achievement",
          error.code || "achievements/unknown",
        ),
      );
    }
  }

  async getUnlockedAchievements(
    userId: string,
  ): Promise<ServiceResult<Achievement[]>> {
    try {
      const achievementsRef = collection(db, "users", userId, "achievements");
      const q = query(achievementsRef, where("unlocked", "==", true));
      const snapshot = await getDocs(q);

      const achievements: Achievement[] = [];
      snapshot.forEach(doc => {
        achievements.push({
          id: doc.id,
          ...(doc.data() as Omit<Achievement, "id">),
        });
      });

      return createSuccessResult(achievements);
    } catch (error: any) {
      return createErrorResult(
        new ApiError(
          error.message || "Failed to fetch unlocked achievements",
          error.code || "achievements/unknown",
        ),
      );
    }
  }

  async getLockedAchievements(
    userId: string,
  ): Promise<ServiceResult<Achievement[]>> {
    try {
      const achievementsRef = collection(db, "users", userId, "achievements");
      const q = query(achievementsRef, where("unlocked", "==", false));
      const snapshot = await getDocs(q);

      const achievements: Achievement[] = [];
      snapshot.forEach(doc => {
        achievements.push({
          id: doc.id,
          ...(doc.data() as Omit<Achievement, "id">),
        });
      });

      return createSuccessResult(achievements);
    } catch (error: any) {
      return createErrorResult(
        new ApiError(
          error.message || "Failed to fetch locked achievements",
          error.code || "achievements/unknown",
        ),
      );
    }
  }

  async filterAchievements(
    userId: string,
    filter: "all" | "unlocked" | "locked",
  ): Promise<ServiceResult<Achievement[]>> {
    try {
      switch (filter) {
        case "unlocked":
          return this.getUnlockedAchievements(userId);
        case "locked":
          return this.getLockedAchievements(userId);
        case "all":
        default:
          return this.getAchievements(userId);
      }
    } catch (error: any) {
      return createErrorResult(
        new ApiError(
          error.message || "Failed to filter achievements",
          error.code || "achievements/unknown",
        ),
      );
    }
  }

  async getUnlockedCount(userId: string): Promise<ServiceResult<number>> {
    try {
      const result = await this.getUnlockedAchievements(userId);

      if (result.result === "ERROR" || !result.data) {
        return createErrorResult(
          result.error ||
            new ApiError(
              "Failed to get unlocked count",
              "achievements/unknown",
            ),
        );
      }

      return createSuccessResult(result.data.length);
    } catch (error: any) {
      return createErrorResult(
        new ApiError(
          error.message || "Failed to get unlocked count",
          error.code || "achievements/unknown",
        ),
      );
    }
  }

  async getTotalCount(userId: string): Promise<ServiceResult<number>> {
    try {
      const result = await this.getAchievements(userId);

      if (result.result === "ERROR" || !result.data) {
        return createErrorResult(
          result.error ||
            new ApiError("Failed to get total count", "achievements/unknown"),
        );
      }

      return createSuccessResult(result.data.length);
    } catch (error: any) {
      return createErrorResult(
        new ApiError(
          error.message || "Failed to get total count",
          error.code || "achievements/unknown",
        ),
      );
    }
  }

  async checkHabitAchievements(
    userId: string,
    habitId: string,
    completionData: { habits: Habit[]; currentHabit: Habit },
  ): Promise<ServiceResult<Achievement[]>> {
    try {
      const { habits } = completionData;

      // Fetch all achievements at once to avoid multiple reads
      const achievementsRef = collection(db, "users", userId, "achievements");
      const achievementsSnapshot = await getDocs(achievementsRef);

      if (achievementsSnapshot.empty) {
        return createSuccessResult([]);
      }

      // Prepare for batch update to optimize Firebase writes
      const batch = writeBatch(db);
      const unlockedAchievements: Achievement[] = [];
      const allHabits = habits || [];

      // Calculate stats for achievements
      const completedHabitsCount = allHabits.reduce(
        (count: number, habit: Habit) => count + (habit.completedCount || 0),
        0,
      );

      // Get unique categories from habits
      const uniqueCategories = new Set<string>();
      allHabits.forEach((habit: Habit) => {
        if (habit.category) {
          uniqueCategories.add(habit.category);
        }
      });

      // Get the current maximum streak
      const maxStreak = Math.max(
        ...allHabits.map((habit: Habit) => habit.currentStreak || 0),
      );

      // Process each achievement
      achievementsSnapshot.forEach(docSnapshot => {
        const achievement = {
          id: docSnapshot.id,
          ...(docSnapshot.data() as Omit<Achievement, "id">),
        };

        // Skip already unlocked achievements
        if (achievement.unlocked) {
          return;
        }

        let shouldUpdate = false;
        let newProgress = achievement.progress;
        let shouldUnlock = false;

        // Check achievement types and update progress
        // We need to use a custom type check as the data structure might vary
        const achievementType = (achievement as any).type;
        const achievementCondition = achievement.target; // Using target field from Achievement interface

        switch (achievementType) {
          case "first_habit":
            // Check if we have at least one habit
            if (allHabits.length > 0) {
              newProgress = 1;
              shouldUnlock = newProgress >= achievementCondition;
              shouldUpdate = true;
            }
            break;

          case "habits_completed":
            // Update progress based on total completed habits
            newProgress = completedHabitsCount;
            shouldUnlock = newProgress >= achievementCondition;
            shouldUpdate = achievement.progress !== newProgress;
            break;

          case "habit_streak":
            // Update progress based on maximum streak
            newProgress = maxStreak;
            shouldUnlock = newProgress >= achievementCondition;
            shouldUpdate = achievement.progress !== newProgress;
            break;

          case "categories":
            // Update progress based on unique categories
            newProgress = uniqueCategories.size;
            shouldUnlock = newProgress >= achievementCondition;
            shouldUpdate = achievement.progress !== newProgress;
            break;
        }

        // If progress has changed, update the document in the batch
        if (shouldUpdate) {
          const achievementRef = doc(
            db,
            "users",
            userId,
            "achievements",
            achievement.id,
          );

          const updates: Partial<Achievement> = { progress: newProgress };

          if (shouldUnlock) {
            updates.unlocked = true;
            updates.unlockedAt = serverTimestamp();

            // Add to list of newly unlocked achievements
            unlockedAchievements.push({
              ...achievement,
              ...updates,
              progress: newProgress,
            });
          }

          batch.update(achievementRef, updates);
        }
      });

      // Commit batch if there are any updates
      if ((batch as any)._mutations && (batch as any)._mutations.length > 0) {
        await batch.commit();
      }

      return createSuccessResult(unlockedAchievements);
    } catch (error: any) {
      console.error("Error checking habit achievements:", error);
      return createErrorResult(
        new ApiError(
          error.message || "Failed to check habit achievements",
          error.code || "achievements/unknown",
        ),
      );
    }
  }

  // Helper method to initialize default achievements for a new user
  private async initializeDefaultAchievements(userId: string): Promise<void> {
    const batch = writeBatch(db);

    // Create basic achievement templates
    const achievementTemplates = [
      {
        name: "First Step",
        description: "Create your first habit",
        type: "first_habit",
        icon: "🚀",
        target: 1,
        color: "#E50046",
        xp: 10,
        criteria: "Create a habit"
      },
      {
        name: "Consistency Streak",
        description: "Maintain a 7-day streak",
        type: "habit_streak",
        icon: "🔥",
        target: 7,
        color: "#F59E0B",
        xp: 50,
        criteria: "Keep a streak going for 7 days"
      },
      {
        name: "Habit Master",
        description: "Complete 50 habits",
        type: "habits_completed",
        icon: "🏆",
        target: 50,
        color: "#3B82F6",
        xp: 100,
        criteria: "Complete 50 habits"
      },
      {
        name: "Lifetime Streak",
        description: "Achieve a 30-day streak",
        type: "lifetime_streak",
        icon: "⚡",
        target: 30,
        color: "#8B5CF6",
        xp: 200,
        criteria: "Achieve a streak of 30 days on any habit"
      },
      {
        name: "Diversifier",
        description: "Create habits in 3 different categories",
        type: "categories",
        icon: "🌈",
        target: 3,
        color: "#EC4899",
        xp: 30,
        criteria: "Create habits in different categories"
      },
      {
        name: "Perfect Week",
        description: "Complete all scheduled habits for a full week",
        type: "perfect_week",
        icon: "📅",
        target: 1,
        color: "#10B981",
        xp: 75,
        criteria: "Complete all habits for a week"
      },
      {
        name: "Collector",
        description: "Create 10 different habits",
        type: "total_habits",
        icon: "🧩",
        target: 10,
        color: "#6366F1",
        xp: 40,
        criteria: "Create 10 unique habits"
      },
      {
        name: "Long-term Commitment",
        description: "Maintain a habit for 60 days",
        type: "habit_age",
        icon: "⏳",
        target: 60,
        color: "#A3E635",
        xp: 150,
        criteria: "Keep a habit active for 60 days"
      }
    ];

    // Add common fields to each achievement and create documents
    for (const template of achievementTemplates) {
      const achievementData = {
        ...template,
        progress: 0,
        unlocked: false,
        userId: userId,
        category: template.type, // Use type as category
        createdAt: serverTimestamp()
      };
      
      const newDoc = doc(collection(db, "users", userId, "achievements"));
      batch.set(newDoc, achievementData);
    }

    await batch.commit();
  }
}
