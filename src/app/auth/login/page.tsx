"use client";

import GoogleSignInButton from "@/components/forms/GoogleSignInButton";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/lib/context/AuthContext";
import Link from "next/link";
import React, { useState } from "react";
import { FiLock, FiMail } from "react-icons/fi";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { signIn, signInWithGoogle } = useAuth();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setErrors({});
      await signIn(email, password);
    } catch (error: any) {
      console.error("Login error:", error);
      // Handle different types of errors
      if (error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password") {
        setErrors({ general: "Invalid email or password" });
      } else if (error.code === "auth/user-disabled") {
        setErrors({ general: "This account has been disabled" });
      } else if (error.code === "auth/too-many-requests") {
        setErrors({ general: "Too many failed attempts. Try again later" });
      } else if (error.code === "auth/network-request-failed") {
        setErrors({ general: "Network error. Check your connection" });
      } else {
        setErrors({ general: error.message || "An error occurred during login" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setErrors({});
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Google sign in error:", error);

      // Handle specific Google sign-in errors
      if (error.code === "auth/cancelled-popup-request" ||
        error.code === "auth/popup-closed-by-user") {
        setErrors({
          general: "Google sign-in was cancelled. Please try again."
        });
      } else if (error.code === "auth/popup-blocked") {
        setErrors({
          general: "Google sign-in popup was blocked. Please allow popups for this site."
        });
      } else if (error.code === "auth/account-exists-with-different-credential") {
        setErrors({
          general: "An account already exists with this email but with a different sign-in method."
        });
      } else {
        setErrors({
          general: error.message || "An error occurred during Google sign-in. Please try again."
        });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light flex flex-col">
      <Header />

      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="max-w-md w-full mx-auto space-y-6 sm:space-y-8 bg-white  p-6 sm:p-8 rounded-xl shadow-card animate-fadeIn">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 ">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-gray-600 ">
              Sign in to your account to continue
            </p>
          </div>

          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>

            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              label="Email address"
              placeholder="name@example.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              error={errors.email}
              icon={<FiMail className="text-gray-500" />}
              className="transition-all duration-300 ease-in-out"
            />

            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              error={errors.password}
              icon={<FiLock className="text-gray-500" />}
              className="transition-all duration-300 ease-in-out"
            />

            <div>
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-[#E50046] hover:text-[#E50046]/90 transition-colors">
                Forgot your password?
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={loading || googleLoading}
              size="lg"
              className="mt-4">
              Sign in
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 " />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white  text-gray-500 ">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <GoogleSignInButton
                onClick={handleGoogleSignIn}
                loading={googleLoading}
                disabled={loading || googleLoading}
              />
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 ">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="font-medium text-[#E50046] hover:text-[#E50046]/90 transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
