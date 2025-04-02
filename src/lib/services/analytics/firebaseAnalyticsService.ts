import {
  collection,
  db,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "../../firebase/config";
import {
  ApiError,
  ServiceResult,
  createErrorResult,
  createSuccessResult,
} from "../common/types";
import {
  AnalyticsEvent,
  AnalyticsService,
  UserActivity,
  UserStats,
} from "./analyticsService";

export class FirebaseAnalyticsService implements AnalyticsService {
  async initialize(): Promise<void> {
    // No initialization needed
    return Promise.resolve();
  }

  async trackEvent(event: AnalyticsEvent): Promise<ServiceResult<void>> {
    try {
      if (!event.userId) {
        return createErrorResult(
          new ApiError(
            "User ID is required for analytics events",
            "analytics/missing-userid",
            400,
          ),
        );
      }

      // Create an event document in the user's events collection
      const eventsRef = collection(db, "users", event.userId, "events");

      await setDoc(doc(eventsRef), {
        name: event.name,
        timestamp: event.timestamp || serverTimestamp(),
        properties: event.properties || {},
      });

      // If it's a significant event, update the user's activity summary for the day
      if (this.isSignificantEvent(event)) {
        await this.updateDailyActivity(event);
      }

      return createSuccessResult(undefined);
    } catch (error: any) {
      return createErrorResult(
        new ApiError(
          error.message || "Failed to track event",
          error.code || "analytics/unknown",
          500,
        ),
      );
    }
  }

  async getUserActivity(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<ServiceResult<UserActivity[]>> {
    try {
      const activityRef = collection(db, "users", userId, "activity");

      // Convert dates to comparable format (YYYY-MM-DD)
      const start = new Date(startDate).toISOString().split("T")[0];
      const end = new Date(endDate).toISOString().split("T")[0];

      const q = query(
        activityRef,
        where("date", ">=", start),
        where("date", "<=", end),
        orderBy("date", "desc"),
      );

      const snapshot = await getDocs(q);

      const activities: UserActivity[] = [];
      snapshot.forEach(doc => {
        activities.push(doc.data() as UserActivity);
      });

      return createSuccessResult(activities);
    } catch (error: any) {
      return createErrorResult(
        new ApiError(
          error.message || "Failed to get user activity",
          error.code || "analytics/unknown",
          500,
        ),
      );
    }
  }

  async getUserStats(userId: string): Promise<ServiceResult<UserStats>> {
    try {
      // Get user's habits for stats calculations
      const habitsRef = collection(db, "users", userId, "habits");
      const habitsSnapshot = await getDocs(habitsRef);

      if (habitsSnapshot.empty) {
        // Return default stats if no habits exist
        return createSuccessResult({
          dailyStreak: 0,
          longestStreak: 0,
          totalCompletions: 0,
          completionRate: 0,
          habitCount: 0,
        });
      }

      let totalHabits = 0;
      let totalCompletions = 0;
      let highestStreak = 0;
      let currentStreak = 0;
      let possibleCompletions = 0;
      let mostCompletedHabit = undefined;
      let highestCompletions = 0;

      habitsSnapshot.forEach(doc => {
        const habit = doc.data();
        totalHabits++;

        // Track total completions
        const habitCompletions = habit.totalCompletions || 0;
        totalCompletions += habitCompletions;

        // Find habit with most completions
        if (habitCompletions > highestCompletions) {
          highestCompletions = habitCompletions;
          mostCompletedHabit = {
            id: doc.id,
            name: habit.name,
            completions: habitCompletions,
          };
        }

        // Track highest streak
        const habitStreak = habit.streak || 0;
        const habitLongestStreak = habit.longestStreak || 0;

        if (habitStreak > currentStreak) {
          currentStreak = habitStreak;
        }

        if (habitLongestStreak > highestStreak) {
          highestStreak = habitLongestStreak;
        }

        // Track possible completions for completion rate
        // This is a simplification - ideally we'd calculate based on habit frequency and creation date
        if (habit.completedDates && Array.isArray(habit.completedDates)) {
          possibleCompletions += habit.completedDates.length + 5; // Adding arbitrary number as estimate
        }
      });

      // Calculate completion rate (prevent division by zero)
      const completionRate =
        possibleCompletions > 0
          ? Math.round((totalCompletions / possibleCompletions) * 100)
          : 0;

      return createSuccessResult({
        dailyStreak: currentStreak,
        longestStreak: highestStreak,
        totalCompletions,
        completionRate,
        habitCount: totalHabits,
        mostCompletedHabit,
      });
    } catch (error: any) {
      return createErrorResult(
        new ApiError(
          error.message || "Failed to get user stats",
          error.code || "analytics/unknown",
          500,
        ),
      );
    }
  }

  async getDashboardData(userId: string): Promise<
    ServiceResult<{
      recentActivity: UserActivity[];
      stats: UserStats;
    }>
  > {
    try {
      // Get recent 7 days of activity
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const activityResult = await this.getUserActivity(
        userId,
        startDate,
        endDate,
      );
      const statsResult = await this.getUserStats(userId);

      if (activityResult.result === "ERROR" || !activityResult.data) {
        return createErrorResult(
          activityResult.error ||
            new ApiError("Failed to get activity data", "analytics/unknown"),
        );
      }

      if (statsResult.result === "ERROR" || !statsResult.data) {
        return createErrorResult(
          statsResult.error ||
            new ApiError("Failed to get stats data", "analytics/unknown"),
        );
      }

      return createSuccessResult({
        recentActivity: activityResult.data,
        stats: statsResult.data,
      });
    } catch (error: any) {
      return createErrorResult(
        new ApiError(
          error.message || "Failed to get dashboard data",
          error.code || "analytics/unknown",
          500,
        ),
      );
    }
  }

  async getHabitCompletionAnalytics(
    userId: string,
    habitId?: string,
  ): Promise<
    ServiceResult<{
      byDay: Record<string, number>;
      byWeekday: Record<string, number>;
      byTime: Record<string, number>;
    }>
  > {
    try {
      const habitsRef = habitId
        ? [doc(db, "users", userId, "habits", habitId)]
        : collection(db, "users", userId, "habits");

      let habitsData;

      if (habitId) {
        // Get single habit
        const habitDoc = await getDoc(habitsRef[0]);
        if (!habitDoc.exists()) {
          return createErrorResult(
            new ApiError("Habit not found", "habits/not-found", 404),
          );
        }
        habitsData = [
          {
            id: habitDoc.id,
            ...habitDoc.data(),
          },
        ];
      } else {
        // Get all habits
        const snapshot = await getDocs(habitsRef as any);
        habitsData = [];
        snapshot.forEach(doc => {
          habitsData.push({
            id: doc.id,
            ...doc.data(),
          });
        });
      }

      // Initialize result objects
      const byDay: Record<string, number> = {};
      const byWeekday: Record<string, number> = {
        "0": 0, // Sunday
        "1": 0, // Monday
        "2": 0, // Tuesday
        "3": 0, // Wednesday
        "4": 0, // Thursday
        "5": 0, // Friday
        "6": 0, // Saturday
      };
      const byTime: Record<string, number> = {
        morning: 0,
        afternoon: 0,
        evening: 0,
        night: 0,
      };

      // Process all habit completions
      for (const habit of habitsData) {
        const completedDates = habit.completedDates || [];

        // Process each completed date
        for (const dateStr of completedDates) {
          const date = new Date(dateStr);

          // By day (YYYY-MM-DD)
          const dayKey = date.toISOString().split("T")[0];
          byDay[dayKey] = (byDay[dayKey] || 0) + 1;

          // By weekday (0-6)
          const weekday = date.getDay().toString();
          byWeekday[weekday] = (byWeekday[weekday] || 0) + 1;

          // By time of day (simplified approach)
          const hour = date.getHours();
          let timeKey = "night";

          if (hour >= 5 && hour < 12) {
            timeKey = "morning";
          } else if (hour >= 12 && hour < 17) {
            timeKey = "afternoon";
          } else if (hour >= 17 && hour < 22) {
            timeKey = "evening";
          }

          byTime[timeKey] = (byTime[timeKey] || 0) + 1;
        }
      }

      return createSuccessResult({
        byDay,
        byWeekday,
        byTime,
      });
    } catch (error: any) {
      return createErrorResult(
        new ApiError(
          error.message || "Failed to get habit analytics",
          error.code || "analytics/unknown",
          500,
        ),
      );
    }
  }

  // Helper to determine if an event should update daily activity
  private isSignificantEvent(event: AnalyticsEvent): boolean {
    const significantEvents = [
      "habit_completed",
      "habit_created",
      "achievement_unlocked",
      "user_login",
    ];

    return significantEvents.includes(event.name);
  }

  // Helper to update the user's daily activity record
  private async updateDailyActivity(event: AnalyticsEvent): Promise<void> {
    const userId = event.userId!;
    const today = new Date().toISOString().split("T")[0];
    const activityRef = doc(db, "users", userId, "activity", today);

    // Get existing activity for today
    const activityDoc = await getDoc(activityRef);
    let activity: UserActivity;

    if (activityDoc.exists()) {
      activity = activityDoc.data() as UserActivity;
    } else {
      // Create new activity record for today
      activity = {
        userId,
        date: today,
        habitCompletions: 0,
        loginCount: 0,
        newHabitsCreated: 0,
        achievementsUnlocked: 0,
      };
    }

    // Update the relevant counter based on event type
    switch (event.name) {
      case "habit_completed":
        activity.habitCompletions += 1;
        break;
      case "habit_created":
        activity.newHabitsCreated += 1;
        break;
      case "achievement_unlocked":
        activity.achievementsUnlocked += 1;
        break;
      case "user_login":
        activity.loginCount += 1;
        break;
    }

    // Save the updated activity
    await setDoc(activityRef, activity);
  }
}
