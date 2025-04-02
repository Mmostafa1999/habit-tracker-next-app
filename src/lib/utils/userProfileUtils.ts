import { User } from "firebase/auth";
import { db, doc, getDoc } from "../firebase/config";

export interface UserProfileData {
  displayName: string | null;
  profileImage: string | null;
  email: string | null;
  emailVerified: boolean;
}

/**
 * Fetches the user's profile data from Firestore, combining with Firebase Auth data
 * @param user The Firebase Auth user object
 * @returns Promise with the combined user profile data
 */
export async function getUserProfileData(
  user: User | null,
): Promise<UserProfileData | null> {
  if (!user) return null;

  try {
    // Start with Firebase Auth data
    const profileData: UserProfileData = {
      displayName: user.displayName,
      profileImage: user.photoURL,
      email: user.email,
      emailVerified: user.emailVerified,
    };

    // Get data from Firestore if it exists
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const firestoreData = userDoc.data();

      // Override with Firestore data if present
      if (firestoreData.profileImage) {
        profileData.profileImage = firestoreData.profileImage;
      }

      if (firestoreData.displayName) {
        profileData.displayName = firestoreData.displayName;
      }
    }

    return profileData;
  } catch (error) {
    console.error("Error fetching user profile data:", error);
    return null;
  }
}
