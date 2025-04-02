"use client";

import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/lib/context/AuthContext";
import Link from "next/link";
import React, { useState } from "react";
import { FiArrowLeft, FiMail } from "react-icons/fi";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { resetPassword } = useAuth();

  const validateForm = () => {
    if (!email) {
      setError("Email is required");
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Email is invalid");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Reset password error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light flex flex-col">
      <Header />

      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="max-w-md w-full mx-auto space-y-8 bg-white p-8 rounded-xl shadow-card animate-fadeIn">
          {!isSubmitted ? (
            <>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">
                  Forgot password?
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  Enter your email and we&apos;ll send you a link to reset your
                  password
                </p>
              </div>

              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                  error={error}
                  icon={<FiMail className="text-gray-500" />}
                />

                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  disabled={loading}
                  size="lg">
                  Reset Password
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-8 space-y-4 animate-fadeIn">
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
              <h2 className="text-2xl font-bold text-gray-900">
                Check your email
              </h2>
              <p className="text-gray-600">
                We&apos;ve sent a password reset link to{" "}
                <span className="font-medium">{email}</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Didn&apos;t receive the email? Check your spam folder or try
                again.
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center text-sm font-medium text-primary hover:text-primary-light transition-colors group">
              <FiArrowLeft className="mr-2 group-hover:translate-x-[-3px] transition-transform duration-200" />
              Back to login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
