"use client";

import { useCallback, useState } from "react";
import { useAchievements } from "../context/AchievementContext";
import { useHabits } from "../context/HabitContext";
import { getCompletionRate, getCurrentStreak } from "../utils/statisticsUtils";

interface GeminiResponse {
  text: string;
}

interface UseGeminiAIReturn {
  generateResponse: (prompt: string) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

/**
 * A custom hook that provides an interface to interact with the Gemini AI API
 * by including relevant user context for personalized responses.
 */
export function useGeminiAI(): UseGeminiAIReturn {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get user data from context
  const { habits, todayHabits } = useHabits();
  const { achievements } = useAchievements();

  const generateResponse = useCallback(
    async (prompt: string): Promise<string> => {
      setIsLoading(true);
      setError(null);

      try {
        // Prepare user context for more personalized AI responses
        const userContext = {
          habits: todayHabits,
          achievements,
          stats: {
            completionRate: getCompletionRate(habits, "7days"),
            currentStreak: getCurrentStreak(habits),
          },
        };

        // Call the API route
        const response = await fetch("/api/gemini", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            userContext,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to get AI response");
        }

        const data = (await response.json()) as GeminiResponse;
        return data.text;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
        return `Sorry, I couldn't process your request at this time. Please try again later.`;
      } finally {
        setIsLoading(false);
      }
    },
    [habits, todayHabits, achievements],
  );

  return {
    generateResponse,
    isLoading,
    error,
  };
}
