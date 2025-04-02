import { User } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import {
  auth,
  createUserWithEmailAndPassword,
  db,
  doc,
  onAuthStateChanged as fbOnAuthStateChanged,
  signOut as fbSignOut,
  updateProfile as fbUpdateProfile,
  getDoc,
  googleProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  serverTimestamp,
  setDoc,
  signInWithEmailAndPassword,
  signInWithPopup,
  writeBatch,
} from "../../firebase/config";
import { defaultAchievements } from "../../utils/achievementUtils";
import {
  ApiError,
  ServiceResult,
  createErrorResult,
  createSuccessResult,
} from "../common/types";
import { AuthService, UserProfile } from "./authService";

export class FirebaseAuthService implements AuthService {
  async initialize(): Promise<void> {
    // Nothing needed for init
    return Promise.resolve();
  }

  async signInWithEmail(
    email: string,
    password: string,
  ): Promise<ServiceResult<UserProfile>> {
    // Basic validation
    if (!email || !email.includes("@") || !password) {
      console.error("Invalid email or password format");
      return createErrorResult(
        new ApiError(
          "Please provide a valid email and password",
          "auth/invalid-input",
          400,
        ),
      );
    }

    try {
      console.log("Attempting to sign in with email:", email);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      console.log("Sign-in successful");
      return createSuccessResult(this.mapUserToProfile(userCredential.user));
    } catch (error: any) {
      console.error(
        "Firebase auth error during sign in:",
        error.code,
        error.message,
      );

      // Add specific handling for common auth errors
      if (error.code === "auth/invalid-credential") {
        return createErrorResult(
          new ApiError("Invalid email or password", error.code, 401),
        );
      } else if (error.code === "auth/user-not-found") {
        return createErrorResult(
          new ApiError("No account found with this email", error.code, 401),
        );
      } else if (error.code === "auth/wrong-password") {
        return createErrorResult(
          new ApiError("Incorrect password", error.code, 401),
        );
      }

      return createErrorResult(
        new ApiError(
          error.message || "Failed to sign in",
          error.code || "auth/unknown",
          401,
        ),
      );
    }
  }

  async signUpWithEmail(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<ServiceResult<UserProfile>> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // Set display name if provided
      if (displayName) {
        await fbUpdateProfile(userCredential.user, { displayName });
      }

      // Send verification email
      await sendEmailVerification(userCredential.user);

      // Store additional user data in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: displayName || null,
        photoURL: userCredential.user.photoURL,
        emailVerified: userCredential.user.emailVerified,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });

      // Initialize user data (achievements, etc.)
      const profile = this.mapUserToProfile(userCredential.user);
      await this.initializeUserData(profile);

      return createSuccessResult(profile);
    } catch (error: any) {
      return createErrorResult(
        new ApiError(
          error.message || "Failed to sign up",
          error.code || "auth/unknown",
          400,
        ),
      );
    }
  }

  async signInWithGoogle(): Promise<ServiceResult<UserProfile>> {
    try {
      console.log("Attempting to sign in with Google");

      // Configure Google provider with custom parameters
      googleProvider.setCustomParameters({ prompt: "select_account" });

      let userCredential;
      try {
        // Attempt to sign in with popup
        userCredential = await signInWithPopup(auth, googleProvider);
      } catch (error: any) {
        console.error("Google popup error:", error.code, error.message);

        // Handle specific popup errors
        if (
          error.code === "auth/cancelled-popup-request" ||
          error.code === "auth/popup-blocked" ||
          error.code === "auth/popup-closed-by-user"
        ) {
          const errorMessage =
            error.code === "auth/popup-blocked"
              ? "Google sign-in popup was blocked. Please allow popups for this site."
              : "Google sign-in was cancelled. Please try again.";

          return createErrorResult(new ApiError(errorMessage, error.code, 400));
        }

        // For other errors, create an error result
        return createErrorResult(
          new ApiError(
            error.message || "Failed to sign in with Google",
            error.code || "auth/unknown",
            401,
          ),
        );
      }

      if (!userCredential || !userCredential.user) {
        return createErrorResult(
          new ApiError(
            "Failed to get user credentials from Google",
            "auth/unknown",
            401,
          ),
        );
      }

      const { user } = userCredential;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));

      // If user doesn't exist, create a new user record
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });

        // Initialize user data (achievements, etc.)
        const profile = this.mapUserToProfile(user);
        await this.initializeUserData(profile);
      } else {
        // Update last login time
        await setDoc(
          doc(db, "users", user.uid),
          { lastLogin: serverTimestamp() },
          { merge: true },
        );
      }

      console.log("Google sign-in successful");
      return createSuccessResult(this.mapUserToProfile(user));
    } catch (error: any) {
      console.error(
        "Firebase auth error during Google sign-in:",
        error.code,
        error.message,
      );

      // Handle specific auth errors
      if (error.code === "auth/account-exists-with-different-credential") {
        return createErrorResult(
          new ApiError(
            "An account already exists with the same email but different sign-in method.",
            error.code,
            400,
          ),
        );
      }

      return createErrorResult(
        new ApiError(
          error.message || "Failed to sign in with Google",
          error.code || "auth/unknown",
          401,
        ),
      );
    }
  }

  async signOut(): Promise<ServiceResult<void>> {
    try {
      await fbSignOut(auth);
      return createSuccessResult(undefined);
    } catch (error: any) {
      return createErrorResult(
        new ApiError(
          error.message || "Failed to sign out",
          error.code || "auth/unknown",
        ),
      );
    }
  }

  async resetPassword(email: string): Promise<ServiceResult<void>> {
    try {
      await sendPasswordResetEmail(auth, email);
      return createSuccessResult(undefined);
    } catch (error: any) {
      return createErrorResult(
        new ApiError(
          error.message || "Failed to send password reset email",
          error.code || "auth/unknown",
          400,
        ),
      );
    }
  }

  async getCurrentUser(): Promise<ServiceResult<UserProfile | null>> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return createSuccessResult(null);
      }
      return createSuccessResult(this.mapUserToProfile(user));
    } catch (error: any) {
      return createErrorResult(
        new ApiError(
          error.message || "Failed to get current user",
          error.code || "auth/unknown",
        ),
      );
    }
  }

  async updateUserProfile(
    data: Partial<UserProfile>,
  ): Promise<ServiceResult<UserProfile>> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return createErrorResult(
          new ApiError("No user is signed in", "auth/no-user", 401),
        );
      }

      // Update Auth profile (only supports displayName and photoURL)
      if (data.displayName || data.photoURL) {
        await fbUpdateProfile(user, {
          displayName: data.displayName || user.displayName,
          photoURL: data.photoURL || user.photoURL,
        });
      }

      // Update Firestore profile (can update all fields)
      await setDoc(
        doc(db, "users", user.uid),
        {
          ...data,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      // Get fresh user data
      const updatedUser = auth.currentUser;
      if (!updatedUser) {
        throw new Error("User disappeared after update");
      }

      return createSuccessResult(this.mapUserToProfile(updatedUser));
    } catch (error: any) {
      return createErrorResult(
        new ApiError(
          error.message || "Failed to update profile",
          error.code || "auth/unknown",
          400,
        ),
      );
    }
  }

  async verifyToken(): Promise<ServiceResult<boolean>> {
    try {
      const isValid = await verifyAuth();
      return createSuccessResult(isValid);
    } catch (error: any) {
      return createErrorResult(
        new ApiError(
          error.message || "Failed to verify token",
          error.code || "auth/token-verification-failed",
          401,
        ),
        401,
      );
    }
  }

  async getToken(): Promise<ServiceResult<string | null>> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return createSuccessResult(null);
      }
      const token = await user.getIdToken();
      return createSuccessResult(token);
    } catch (error: any) {
      return createErrorResult(
        new ApiError(
          error.message || "Failed to get token",
          error.code || "auth/unknown",
        ),
      );
    }
  }

  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void {
    return fbOnAuthStateChanged(auth, user => {
      if (user) {
        callback(this.mapUserToProfile(user));
      } else {
        callback(null);
      }
    });
  }

  async initializeUserData(user: UserProfile): Promise<ServiceResult<void>> {
    try {
      // Check if the user already has achievements
      const achievementsRef = collection(db, "users", user.uid, "achievements");
      const achievementsSnapshot = await getDocs(achievementsRef);

      // If no achievements exist, create defaults
      if (achievementsSnapshot.empty) {
        const initialAchievements = defaultAchievements.map(achievement => ({
          ...achievement,
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

  // Helper method to map Firebase User to UserProfile
  private mapUserToProfile(user: User): UserProfile {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
    };
  }
}
