"use client";

import { Achievement } from "@/lib/types";
import { format, isValid } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import React from "react";
import { getAchievementProgressPercentage } from "@/lib/utils/achievementUtils";

interface AchievementCardProps {
  achievement: Achievement;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
}) => {
  const {
    name: title,
    description,
    icon,
    progress,
    target,
    unlocked,
    unlockedAt,
    color = "#6366F1",
    xp = 0,
    type,
  } = achievement;

  // Calculate the progress percentage using the utility function
  const progressPercentage = getAchievementProgressPercentage(achievement);

  // Format the unlocked date safely
  const formatUnlockedDate = () => {
    if (!unlockedAt) return "Recently";

    let dateValue: Date | null = null;

    // Handle different potential types of the unlockedAt value
    if (typeof unlockedAt === "string") {
      // String date format
      dateValue = new Date(unlockedAt);
    } else if (unlockedAt instanceof Date) {
      // Already a Date object
      dateValue = unlockedAt;
    } else if (typeof unlockedAt === "object" && "toDate" in unlockedAt) {
      // Firestore Timestamp object
      try {
        dateValue = (unlockedAt as Timestamp).toDate();
      } catch (error) {
        console.error("Error converting timestamp:", error);
      }
    }

    if (!dateValue || !isValid(dateValue)) return "Recently";

    return format(dateValue, "MMM d, yyyy");
  };

  // Get achievement type display name
  const getAchievementTypeDisplay = (type?: string) => {
    if (!type) return "Achievement";

    const typeMap: Record<string, string> = {
      'first_habit': 'Milestone',
      'habits_completed': 'Completion',
      'habit_streak': 'Streak',
      'lifetime_streak': 'Lifetime Streak',
      'categories': 'Diversity',
      'total_habits': 'Collection',
      'perfect_week': 'Perfect Week',
      'habit_age': 'Longevity',
      'daily_habits': 'Daily Routine',
      'weekly_habits': 'Weekly Routine',
      'monthly_habits': 'Monthly Routine',
    };

    return typeMap[type] || 'Achievement';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-lg shadow-md overflow-hidden ${unlocked ? "bg-white" : "bg-gray-100"}`}>
      <div className={`p-4 ${unlocked ? "" : "opacity-70"}`}>
        <div className="flex items-center mb-3">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-full text-white text-2xl mr-4"
            style={{ backgroundColor: color }}>
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 flex items-center">
              {title}
              {unlocked && <span className="ml-2 text-yellow-500">✓</span>}
            </h3>
            <p className="text-sm text-gray-600">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between mb-1 text-xs text-gray-600">
            <span>{getAchievementTypeDisplay(type)} • {xp} XP</span>
            <span>
              {progress} / {target}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500 ease-in-out"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: color
              }}></div>
          </div>
        </div>

        {unlocked && (
          <div className="mt-2 text-xs text-gray-500">
            Unlocked: {formatUnlockedDate()}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AchievementCard;
