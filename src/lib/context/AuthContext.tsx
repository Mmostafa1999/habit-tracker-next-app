"use client";

import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import { UserProfile } from "../services/auth/authService";
import { getAuthService } from "../services/serviceFactory";
import { handleError, showInfo, showSuccess } from "../utils/errorHandling";
import { cleanFirebaseLocalStorage } from "../utils/localStorageCleanup";


type AuthContextType = {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const authService = getAuthService();

  useEffect(() => {
    // Clean localStorage of any Firebase data on initial load
    cleanFirebaseLocalStorage();

    // Check for redirect results first (for Google sign-in)
    const checkRedirectResult = async () => {
      try {
        // This handles the redirect result from Google sign-in
        const redirectResult = await authService.handleRedirectResult();
        if (redirectResult.result === "SUCCESS" && redirectResult.data) {
          showSuccess("Signed in with Google successfully!");
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error handling redirect result:", error);
      }
    };

    // Call the redirect handler
    checkRedirectResult();

    // Handle auth state changes
    const unsubscribe = authService.onAuthStateChanged((profile) => {
      setUser(profile);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await authService.signInWithEmail(email, password);

      if (result.result === "SUCCESS" && result.data) {
        showSuccess("Signed in successfully!");
        router.push("/dashboard");
      } else if (result.error) {
        throw result.error;
      }
    } catch (error: Error | ApiError) {
      console.error("Authentication error details:", error);
      // Check for specific Firebase Auth errors and handle them accordingly
      if ('code' in error) {
        if (error.code === "auth/invalid-credential" ||
          error.code === "auth/user-not-found" ||
          error.code === "auth/wrong-password") {
          showInfo("Invalid email or password. Please try again.");
        } else if (error.code === "auth/user-disabled") {
          showInfo("This account has been disabled. Please contact support.");
        } else if (error.code === "auth/too-many-requests") {
          showInfo("Too many failed login attempts. Please try again later or reset your password.");
        } else if (error.code === "auth/email-not-verified") {
          showInfo("Please verify your email before logging in. Check your inbox for the verification link.");
        } else {
          handleError(error);
        }
      } else {
        handleError(error);
      }
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    try {
      const result = await authService.signUpWithEmail(email, password, displayName);

      if (result.result === "SUCCESS") {
        showSuccess("Account created successfully! Please check your email and verify your account before logging in.");
        router.push("/auth/login");
      } else if (result.error) {
        throw result.error;
      }
    } catch (error) {
      handleError(error);
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    setLoading(true);
    try {
      const result = await authService.signOut();

      if (result.result === "SUCCESS") {
        router.push("/auth/login");
        showSuccess("Signed out successfully!");
      } else if (result.error) {
        throw result.error;
      }
    } catch (error) {
      throw error;
      setLoading(false);

    }finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const result = await authService.resetPassword(email);

      if (result.result === "SUCCESS") {
        showSuccess("Password reset email sent!");
      } else if (result.error) {
        throw result.error;
      }
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await authService.signInWithGoogle();

      if (result.result === "SUCCESS") {
        showSuccess("Signed in with Google successfully!");
        router.push("/dashboard");
      } else if (result.error) {
        throw result.error;
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        logOut,
        resetPassword,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
