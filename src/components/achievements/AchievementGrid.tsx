"use client";

import { Achievement } from "@/lib/types";
import { motion } from "framer-motion";
import React, { useMemo } from "react";
import AchievementCard from "./AchievementCard";

interface AchievementGridProps {
  achievements: Achievement[];
  loading: boolean;
}

const AchievementGrid: React.FC<AchievementGridProps> = ({
  achievements,
  loading,
}) => {
  // Deduplicate achievements by ID to ensure no duplicates are rendered
  const uniqueAchievements = useMemo(() => {
    const uniqueMap = new Map<string, Achievement>();
    achievements.forEach(achievement => {
      if (!uniqueMap.has(achievement.id)) {
        uniqueMap.set(achievement.id, achievement);
      }
    });
    return Array.from(uniqueMap.values());
  }, [achievements]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="rounded-lg shadow-md animate-pulse bg-gray-200  h-40"
          />
        ))}
      </div>
    );
  }

  if (uniqueAchievements.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-4">🏆</div>
          <h3 className="text-xl font-medium text-gray-900">
            No achievements found
          </h3>
          <p className="text-gray-500  mt-2">
            Start completing habits to unlock achievements!
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}>
      {uniqueAchievements.map(achievement => (
        <AchievementCard
          key={`achievement-${achievement.id}`}
          achievement={achievement}
        />
      ))}
    </motion.div>
  );
};

export default AchievementGrid;
