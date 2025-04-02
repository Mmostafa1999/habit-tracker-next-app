"use client";

import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import { UserProfile } from "../services/auth/authService";
import { getAuthService } from "../services/serviceFactory";
import { ApiError, handleError, showInfo, showSuccess } from "../utils/errorHandling";

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
    // Handle auth state changes
    const unsubscribe = authService.onAuthStateChanged((profile) => {
      setUser(profile);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

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
        } else {
          handleError(error);
        }
      } else {
        handleError(error);
      }
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    try {
      const result = await authService.signUpWithEmail(email, password, displayName);

      if (result.result === "SUCCESS") {
        showInfo("Account created successfully! Please verify your email.");
        router.push("/dashboard");
      } else if (result.error) {
        throw result.error;
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      const result = await authService.signOut();

      if (result.result === "SUCCESS") {
        showSuccess("Signed out successfully!");
        router.push("/auth/login");
      } else if (result.error) {
        throw result.error;
      }
    } catch (error) {
      throw error;
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
