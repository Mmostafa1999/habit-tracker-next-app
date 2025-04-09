"use client";

import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import { UserProfile } from "../services/auth/authService";
import { getAuthService } from "../services/serviceFactory";
import { processError, showSuccess } from "../utils/errorHandling";
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
    cleanFirebaseLocalStorage(true);

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
        processError(error, "Error handling redirect result", false);
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
    } catch (error) {
      // Special handling for auth-specific errors
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const errorInfo = processError(error, undefined, true);
        setLoading(false);
        throw errorInfo;
      } else {
        const errorInfo = processError(error, "Authentication failed", true);
        setLoading(false);
        throw errorInfo;
      }
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
      const errorInfo = processError(error, "Failed to create account", true);
      setLoading(false);
      throw errorInfo;
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

        // Clean local storage on logout
        cleanFirebaseLocalStorage(false);
      } else if (result.error) {
        throw result.error;
      }
    } catch (error) {
      processError(error, "Failed to sign out", true);
      throw error;
    } finally {
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
      processError(error, "Failed to send password reset email", true);
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
      processError(error, "Failed to sign in with Google", true);
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
