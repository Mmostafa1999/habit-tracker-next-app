"use client";

import AiAssistant from "@/app/dashboard/assistant/AiAssistant";
import DashboardHeader from "@/components/layout/DashboardHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { AchievementProvider } from "@/lib/context/AchievementContext";
import { useAuth } from "@/lib/context/AuthContext";
import { HabitProvider } from "@/lib/context/HabitContext";

export default function AssistantPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login page happens automatically via middleware
    return null;
  }

  return (
    <HabitProvider>
      <AchievementProvider>
        <>
          {/* Header */}
          <DashboardHeader />

          {/* Main Dashboard Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 ">
                  AI Habit Assistant
                </h1>
                <p className="text-gray-600 ">
                  Ask questions about your habits, get personalized
                  suggestions, or receive feedback on your progress.
                </p>
              </div>

              {/* AI Assistant Component */}
              <AiAssistant />

              {/* Usage Tips */}
              <div className="mt-8 bg-white  p-6 rounded-lg shadow-md">
                <h2 className="font-bold text-lg mb-4 text-gray-900 ">
                  How to use the AI Assistant
                </h2>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ">
                  <li>Ask about your current habits and their progress</li>
                  <li>Get information about your achievements and streaks</li>
                  <li>
                    Request personalized suggestions to improve consistency
                  </li>
                  <li>Ask which habits need attention today</li>
                  <li>
                    Get motivation and encouragement for your habit journey
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </>
      </AchievementProvider>
    </HabitProvider>
  );
}
