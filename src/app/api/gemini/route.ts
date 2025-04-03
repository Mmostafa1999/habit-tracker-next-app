import { NextRequest, NextResponse } from "next/server";

// Define proper types for context data
interface Habit {
  id: string;
  title: string;
  category: string;
  frequency: string;
  isCompleted: boolean;
  date: string;
  selectedDays?: string[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string | Date;
  icon: string;
}

interface UserStats {
  completionRate?: number;
  currentStreak?: number;
  [key: string]: number | undefined;
}

interface SafetyRating {
  category: string;
  probability: string;
}

// Type for the expected request body format
interface GeminiRequest {
  prompt: string;
  userId?: string;
  userContext?: {
    habits?: Habit[];
    achievements?: Achievement[];
    stats?: UserStats;
  };
}

// Type for the response from Gemini API
interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
  promptFeedback: {
    safetyRatings: SafetyRating[];
  };
}

// Rate limiting configuration
const RATE_LIMIT = {
  tokensPerMinute: 10, // Number of requests allowed per minute per user
  window: 60 * 1000, // 1 minute in milliseconds
};

// Simple in-memory rate limiter (for production, use Redis or similar)
const rateLimiter: Record<string, { count: number; timestamp: number }> = {};

/**
 * API handler for Gemini AI requests
 */
export async function POST(request: NextRequest) {
  try {
    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey || apiKey.trim() === "") {
      console.error("Missing Gemini API key in environment variables");
      return NextResponse.json(
        { error: "API configuration error - Gemini API key is not configured" },
        { status: 500 },
      );
    }

    // Ensure request has proper content type
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Request must be JSON" },
        { status: 400 },
      );
    }

    // Get client IP for rate limiting
    // In production, you might need to handle forwarded IPs if behind a proxy
    const clientIp = request.headers.get("x-forwarded-for") || "unknown-ip";

    // Apply rate limiting
    if (rateLimiter[clientIp]) {
      const { count, timestamp } = rateLimiter[clientIp];
      const elapsed = Date.now() - timestamp;

      if (elapsed < RATE_LIMIT.window) {
        // Check if rate limit exceeded in current window
        if (count >= RATE_LIMIT.tokensPerMinute) {
          return NextResponse.json(
            { error: "Rate limit exceeded. Try again later." },
            { status: 429 },
          );
        }

        // Increment count in current window
        rateLimiter[clientIp].count += 1;
      } else {
        // Reset for new window
        rateLimiter[clientIp] = { count: 1, timestamp: Date.now() };
      }
    } else {
      // First request from this IP
      rateLimiter[clientIp] = { count: 1, timestamp: Date.now() };
    }

    // Parse request body
    const data: GeminiRequest = await request.json();

    // Validate required fields
    if (!data.prompt || typeof data.prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required and must be a string" },
        { status: 400 },
      );
    }

    // Prepare request for Gemini API
    const geminiRequest = {
      contents: [
        {
          parts: [{ text: buildPromptWithContext(data) }],
        },
      ],
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    };

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(geminiRequest),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      return NextResponse.json(
        { error: "Error from Gemini API", details: errorData },
        { status: 500 },
      );
    }

    const geminiResponse: GeminiResponse = await response.json();

    // Check if we have a valid response
    if (
      !geminiResponse.candidates ||
      geminiResponse.candidates.length === 0 ||
      !geminiResponse.candidates[0].content ||
      !geminiResponse.candidates[0].content.parts ||
      geminiResponse.candidates[0].content.parts.length === 0
    ) {
      return NextResponse.json(
        { error: "No response generated" },
        { status: 500 },
      );
    }

    // Return the text response
    return NextResponse.json({
      text: geminiResponse.candidates[0].content.parts[0].text,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

/**
 * Builds a full prompt with user context for the AI
 */
function buildPromptWithContext(data: GeminiRequest): string {
  const { prompt, userContext } = data;

  // Start with a system prompt that sets the role and capabilities
  let fullPrompt = `You are an AI habit assistant for a habit tracking app. Your purpose is to help users with their habits, provide motivation, and answer questions about their habit tracking journey.

Reply with friendly, concise, and helpful responses. Focus on being supportive and encouraging.

`;

  // Add user context if available
  if (userContext) {
    fullPrompt += "--- USER CONTEXT ---\n";

    // Add habits information
    if (userContext.habits && userContext.habits.length > 0) {
      fullPrompt += "\nCURRENT HABITS:\n";
      userContext.habits.forEach(habit => {
        const status = habit.isCompleted ? "✅ Completed" : "⏳ Pending";
        fullPrompt += `- ${habit.title} (Category: ${habit.category}, Frequency: ${habit.frequency}) - ${status}\n`;
      });
    } else {
      fullPrompt += "\nNo habits tracked yet.\n";
    }

    // Add achievements information
    if (userContext.achievements && userContext.achievements.length > 0) {
      const unlockedAchievements = userContext.achievements.filter(
        a => a.unlocked,
      );
      fullPrompt += `\nACHIEVEMENTS UNLOCKED: ${unlockedAchievements.length}/${userContext.achievements.length}\n`;
      unlockedAchievements.forEach(achievement => {
        fullPrompt += `- ${achievement.title}: ${achievement.description}\n`;
      });
    }

    // Add stats information
    if (userContext.stats) {
      fullPrompt += "\nSTATS:\n";
      if (userContext.stats.completionRate !== undefined) {
        fullPrompt += `- Completion rate: ${userContext.stats.completionRate.toFixed(1)}%\n`;
      }
      if (userContext.stats.currentStreak !== undefined) {
        fullPrompt += `- Current streak: ${userContext.stats.currentStreak} days\n`;
      }
      // Add any additional stats that might be present
      Object.entries(userContext.stats)
        .filter(
          ([key]) =>
            key !== "completionRate" && key !== "currentStreak" && key !== "id",
        )
        .forEach(([key, value]) => {
          if (value !== undefined) {
            fullPrompt += `- ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}\n`;
          }
        });
    }
  }

  // Add the user's actual prompt at the end
  fullPrompt += `\n--- USER QUESTION ---\n${prompt}`;

  return fullPrompt;
}
