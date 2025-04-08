import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { defaultAchievements } from "../../../utils/achievementUtils";
import { UserProfile } from "../authService";
import { ApiError, ServiceResult, createErrorResult, createSuccessResult } from "../../common/types";

/**
 * Initializes user data including achievements
 */
export async function initializeUserData(user: UserProfile): Promise<ServiceResult<void>> {
  try {
    // Check if the user already has achievements
    const achievementsRef = collection(db, "users", user.uid, "achievements");
    const achievementsSnapshot = await getDocs(achievementsRef);

    // If no achievements exist, create defaults
    if (achievementsSnapshot.empty) {
      const initialAchievements = defaultAchievements.map((achievement, index) => ({
        ...achievement,
        id: `achievement_${index}`, // Add an ID to each achievement
        progress: 0,
        unlocked: false,
      }));

      // Save default achievements to Firestore
      const batch = writeBatch(db);
      initialAchievements.forEach(achievement => {
        const newDoc = doc(
          db,
          "users",
          user.uid,
          "achievements",
          achievement.id,
        );
        batch.set(newDoc, achievement);
      });

      await batch.commit();
    }

    return createSuccessResult(undefined);
  } catch (error: any) {
    return createErrorResult(
      new ApiError(
        error.message || "Failed to initialize user data",
        error.code || "auth/unknown",
      ),
    );
  }
} 