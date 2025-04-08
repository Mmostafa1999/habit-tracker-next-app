/**
 * Service Factory
 *
 * Centralized factory for creating and accessing services.
 * This provides a clean way to manage dependencies and allows for easy mocking in tests.
 */
import { AchievementService } from "./achievements/achievementService";
import { FirebaseAchievementService } from "./achievements/firebaseAchievementService";
import { AnalyticsService } from "./analytics/analyticsService";
import { FirebaseAnalyticsService } from "./analytics/firebaseAnalyticsService";
import { AuthService } from "./auth/authService";
import { FirebaseAuthService } from "./auth/firebase";
import { FirebaseHabitService } from "./habits/firebaseHabitService";
import { HabitService } from "./habits/habitService";

// Singleton instances of services
let authService: AuthService | null = null;
let habitService: HabitService | null = null;
let achievementService: AchievementService | null = null;
let analyticsService: AnalyticsService | null = null;

/**
 * Get the authentication service instance
 */
export function getAuthService(): AuthService {
  if (!authService) {
    authService = new FirebaseAuthService();
  }
  return authService;
}

/**
 * Get the habit service instance
 */
export function getHabitService(): HabitService {
  if (!habitService) {
    habitService = new FirebaseHabitService();
  }
  return habitService;
}

/**
 * Get the achievement service instance
 */
export function getAchievementService(): AchievementService {
  if (!achievementService) {
    achievementService = new FirebaseAchievementService();
  }
  return achievementService;
}

/**
 * Get the analytics service instance
 */
export function getAnalyticsService(): AnalyticsService {
  if (!analyticsService) {
    analyticsService = new FirebaseAnalyticsService();
  }
  return analyticsService;
}

/**
 * Initialize all services
 * This should be called at app startup
 */
export async function initializeServices(): Promise<void> {
  // Initialize auth service
  await getAuthService().initialize();

  // Initialize habit service
  await getHabitService().initialize();

  // Initialize achievement service
  await getAchievementService().initialize();

  // Initialize analytics service
  await getAnalyticsService().initialize();

  // Initialize other services as needed
}

/**
 * Reset all services (mainly used for testing)
 */
export function resetServices(): void {
  authService = null;
  habitService = null;
  achievementService = null;
  analyticsService = null;
}

// Type guard to check if a result has data
export function hasData<T>(result: { data?: T }): result is { data: T } {
  return result.data !== undefined;
}
