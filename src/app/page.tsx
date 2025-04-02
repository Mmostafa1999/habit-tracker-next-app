"use client";

import Button from "@/components/ui/Button";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";

// Lazy load components to reduce initial page load time
const Header = dynamic(() => import("@/components/layout/Header"), {
  ssr: false,
  loading: () => (
    <div className="h-16 bg-white  shadow-sm"></div>
  ),
});

const LoadingSpinner = dynamic(() => import("@/components/ui/LoadingSpinner"), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse bg-gray-200 h-10 w-10 rounded-full"></div>
  ),
});

export default function Home() {
  const [user, setUser] = useState<null | { uid: string }>(null);
  const [loading, setLoading] = useState(true);

  // Load auth state with delay to prioritize UI rendering
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        // Dynamically import auth only when needed
        const { auth, onAuthStateChanged } = await import(
          "@/lib/firebase/config"
        );

        const unsubscribe = onAuthStateChanged(auth, currentUser => {
          setUser(currentUser);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error loading auth:", error);
        setLoading(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light  flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center lg:text-left lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div className="mx-auto lg:mx-0 max-w-md sm:max-w-2xl lg:max-w-none animate-fadeIn">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900  sm:text-5xl md:text-6xl">
                Build better habits,{" "}
                <span className="text-[#E50046] ">
                  one day at a time
                </span>
              </h1>
              <p className="mt-6 text-xl text-gray-500 ">
                Our habit tracker helps you build consistent routines and
                achieve your goals through daily tracking and insightful
                progress analytics.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row sm:justify-center lg:justify-start gap-4">
                {!user ? (
                  <>
                    <Link href="/auth/signup" className="w-full sm:w-auto">
                      <Button size="lg" fullWidth>
                        Get Started
                      </Button>
                    </Link>
                    <Link href="/auth/login" className="w-full sm:w-auto">
                      <Button variant="outline" size="lg" fullWidth>
                        Sign in
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link href="/dashboard" className="w-full sm:w-auto">
                    <Button size="lg" fullWidth>
                      Go to Dashboard
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="mt-12 lg:mt-0 flex justify-center">
              <div className="rounded-lg shadow-xl overflow-hidden max-w-md w-full bg-white  animate-fadeIn">
                <div className="p-6">
                  <div className="flex items-center mb-6">
                    <svg
                      className="h-8 w-8 text-[#E50046]  mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.24 16.83L11 13.69V7H12.5V12.87L17 15.5L16.24 16.83Z"
                        fill="currentColor"></path>
                    </svg>
                    <span className="text-2xl font-bold text-[#E50046] ">
                      HabitTracker
                    </span>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Today&apos;s Habits
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="h-10 w-10 rounded-full bg-[#E50046] flex items-center justify-center text-white mr-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 ">
                            Morning Meditation
                          </p>
                          <p className="text-sm text-gray-500 ">
                            Completed • 8-day streak
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 mr-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 7l-8 8-4-4"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 ">
                            Read 20 Pages
                          </p>
                          <p className="text-sm text-gray-500 ">
                            Not completed yet
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-500 ">
                      2/4 Habits Completed
                    </p>
                    <Button
                      size="sm"
                      disabled={true}
                      className="cursor-not-allowed">
                      View All
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white  py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900  sm:text-4xl">
                Features to Help You Succeed
              </h2>
              <p className="mt-4 text-lg text-gray-500  max-w-2xl mx-auto">
                HabitTracker offers everything you need to create and maintain
                healthy habits.
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="bg-gray-50  p-6 rounded-lg">
                <div className="h-12 w-12 rounded-md bg-[#E50046] text-white flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 ">
                  Daily Tracking
                </h3>
                <p className="mt-2 text-gray-500 ">
                  Easily track all your daily habits and routines in one simple
                  interface.
                </p>
              </div>

              <div className="bg-gray-50  p-6 rounded-lg">
                <div className="h-12 w-12 rounded-md bg-[#E50046] text-white flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 ">
                  Progress Analytics
                </h3>
                <p className="mt-2 text-gray-500 ">
                  Get insights into your habit performance with detailed
                  statistics and streaks.
                </p>
              </div>

              <div className="bg-gray-50  p-6 rounded-lg">
                <div className="h-12 w-12 rounded-md bg-[#E50046] text-white flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 ">
                  Reminders
                </h3>
                <p className="mt-2 text-gray-500 ">
                  Never forget your habits with customizable reminders and
                  notifications.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-[#E50046] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Start Building Better Habits Today
            </h2>
            <p className="mt-4 text-xl text-white/90 max-w-2xl mx-auto">
              Join thousands of users who have successfully built lasting habits
              with HabitTracker.
            </p>
            <div className="mt-8">
              {!user ? (
                <Link href="/auth/signup">
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white hover:bg-gray-100 text-[#E50046] border-white hover:border-white">
                    Sign Up For Free
                  </Button>
                </Link>
              ) : (
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white hover:bg-gray-100 text-[#E50046] border-white hover:border-white">
                    Go to Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
