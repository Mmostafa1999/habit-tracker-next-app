import {
  createUserWithEmailAndPassword,
  onAuthStateChanged as fbOnAuthStateChanged,
  signOut as fbSignOut,
  updateProfile as fbUpdateProfile,
  getRedirectResult,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  ApiError,
  ServiceResult,
  createErrorResult,
  createSuccessResult,
} from "../../common/types";
import { AuthService, UserProfile } from "../authService";
import { clearAuthCookies, setAuthCookies } from "./authCookies";
import { auth, db, googleProvider } from "./firebaseConfig";
import { processGoogleSignIn } from "./googleSignIn";
import { verifyAuth } from "./tokenVerification";
import { initializeUserData } from "./userDataInitialization";
import {
  cleanFirebaseLocalStorage,
  mapUserToProfile,
} from "./userProfileUtils";

export class FirebaseAuthService implements AuthService {
  async initialize(): Promise<void> {
    // Clean any Firebase data from localStorage on initialization
    cleanFirebaseLocalStorage();
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
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // Get the Firebase ID token
      const idToken = await userCredential.user.getIdToken();

      try {
        // Save token in a secure HTTP-only cookie via API call
        await setAuthCookies(idToken);
      } catch (cookieError: any) {
        // Check if this is an email verification error
        if (
          cookieError.message &&
          cookieError.message.includes("Email not verified")
        ) {
          return createErrorResult(
            new ApiError(
              "Please verify your email before logging in",
              "auth/email-not-verified",
              403,
            ),
          );
        }
        // For other cookie errors, rethrow
        throw cookieError;
      }

      return createSuccessResult(mapUserToProfile(userCredential.user));
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
      const profile = mapUserToProfile(userCredential.user);
      await initializeUserData(profile);

      // Return success without setting auth cookies - we'll wait for email verification
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
      // Configure Google provider with custom parameters for better cross-domain compatibility
      googleProvider.setCustomParameters({
        prompt: "select_account",
        // Using fewer parameters for better compatibility
        ux_mode: "popup",
        // Include origin verification for security
        origin:
          typeof window !== "undefined" ? window.location.origin : undefined,
      });

      // Check if this is a sign-in redirect result first
      const result = await getRedirectResult(auth);

      if (result && result.user) {
        // User is signing in after a redirect
        const { user } = result;

        // Process the successful sign-in
        await processGoogleSignIn(user);

        return createSuccessResult(mapUserToProfile(user));
      }

      // If we're not handling a redirect result, start a new sign-in flow
      try {
        // Try popup first as it provides better UX when it works
        const userCredential = await signInWithPopup(auth, googleProvider);
        const { user } = userCredential;

        // Process the successful sign-in
        await processGoogleSignIn(user);

        return createSuccessResult(mapUserToProfile(user));
      } catch (popupError: any) {
        console.error(
          "Popup sign-in error:",
          popupError.code,
          popupError.message,
        );

        // If popup fails, fall back to redirect
        if (
          popupError.code === "auth/cancelled-popup-request" ||
          popupError.code === "auth/popup-blocked" ||
          popupError.code === "auth/popup-closed-by-user"
        ) {
          // Start redirect-based sign-in as fallback
          await signInWithRedirect(auth, googleProvider);

          // This function will not return immediately as the page will redirect
          // The result will be handled when the page loads again
          return createSuccessResult({
            uid: "",
            email: null,
            displayName: null,
            photoURL: null,
            emailVerified: false,
          } as UserProfile);
        }

        // For other errors, propagate them
        throw popupError;
      }
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

      // Clear auth cookies via API call
      await clearAuthCookies();

      // Clean up any Firebase data stored in localStorage
      cleanFirebaseLocalStorage();

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
          error.message || "Failed to send reset email",
          error.code || "auth/unknown",
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
      return createSuccessResult(mapUserToProfile(user));
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
          new ApiError("No user is currently signed in", "auth/no-user", 401),
        );
      }

      // Update auth profile if display name or photo URL is provided
      if (data.displayName || data.photoURL) {
        await fbUpdateProfile(user, {
          displayName: data.displayName || user.displayName,
          photoURL: data.photoURL || user.photoURL,
        });
      }

      // Update the user record in Firestore
      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        {
          ...(data.displayName && { displayName: data.displayName }),
          ...(data.photoURL && { photoURL: data.photoURL }),
          // Add other updateable fields here
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      return createSuccessResult(mapUserToProfile(user));
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
      const token = await user.getIdToken(true); // Force refresh the token
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
        callback(mapUserToProfile(user));
      } else {
        callback(null);
      }
    });
  }

  async initializeUserData(user: UserProfile): Promise<ServiceResult<void>> {
    return initializeUserData(user);
  }

  async handleRedirectResult(): Promise<ServiceResult<UserProfile | null>> {
    try {
      // Get the redirect result
      const result = await getRedirectResult(auth);

      // If there's no result, there was no pending redirect
      if (!result) {
        return createSuccessResult(null);
      }

      // We have a successful redirect login
      const { user } = result;

      // Process the successful sign-in
      await processGoogleSignIn(user);

      return createSuccessResult(mapUserToProfile(user));
    } catch (error: any) {
      console.error(
        "Error handling redirect result:",
        error.code,
        error.message,
      );
      return createErrorResult(
        new ApiError(
          error.message || "Failed to complete sign-in redirect",
          error.code || "auth/unknown",
          401,
        ),
      );
    }
  }
}
