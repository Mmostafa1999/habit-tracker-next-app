"use client";

import GoogleSignInButton from "@/components/forms/GoogleSignInButton";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/lib/context/AuthContext";
import Link from "next/link";
import React, { useState } from "react";
import { FiLock, FiMail, FiUser } from "react-icons/fi";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  const { signUp, signInWithGoogle } = useAuth();

  const validateForm = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name) {
      newErrors.name = "Name is required";
    }

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 12) {
      newErrors.password = "Password must be at least 12 characters";
    } else if (!/(?=.*[a-z])/.test(password)) {
      newErrors.password =
        "Password must contain at least one lowercase letter";
    } else if (!/(?=.*[A-Z])/.test(password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter";
    } else if (!/(?=.*\d)/.test(password)) {
      newErrors.password = "Password must contain at least one number";
    } else if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
      newErrors.password =
        'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      await signUp(email, password);
      setVerificationEmail(email);
      setIsEmailSent(true);
    } catch (error) {
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign in error:", error);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light  flex flex-col">
      <Header />

      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="bg-white  rounded-lg shadow-md max-w-md w-full p-6 sm:p-8 animate-fadeIn">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 ">
              Create an account
            </h1>
            <p className="mt-2 text-sm text-gray-600 ">
              Track your habits and build a better you
            </p>
          </div>

          {!isEmailSent ? (
            <>
              <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  label="Full Name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setName(e.target.value)
                  }
                  error={errors.name}
                  icon={<FiUser className="text-gray-500" />}
                  className="transition-all duration-300 ease-in-out"
                />

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
                  autoComplete="new-password"
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

                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  label="Confirm Password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setConfirmPassword(e.target.value)
                  }
                  error={errors.confirmPassword}
                  icon={<FiLock className="text-gray-500" />}
                  className="transition-all duration-300 ease-in-out"
                />

                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  disabled={loading || googleLoading}
                  size="lg"
                  className="mt-4">
                  Sign up
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
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="font-medium text-[#E50046] hover:text-[#E50046]/90 transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-100">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 ">
                Verify your email
              </h2>
              <p className="text-gray-600 ">
                We&apos;ve sent a verification link to{" "}
                <span className="font-medium">{verificationEmail}</span>
              </p>
              <p className="text-sm text-gray-500  mt-2">
                Please check your inbox and verify your email to access all
                features.
              </p>
              <div className="mt-6">
                <Link href="/auth/login">
                  <Button variant="outline" fullWidth>
                    Go to Login
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
