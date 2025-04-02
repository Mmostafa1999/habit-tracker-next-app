"use client";

import { motion } from "framer-motion";
import React from "react";

interface AchievementFiltersProps {
  activeFilter: "all" | "unlocked" | "locked";
  setActiveFilter: (filter: "all" | "unlocked" | "locked") => void;
  unlockedCount: number;
  totalAchievements: number;
}

const AchievementFilters: React.FC<AchievementFiltersProps> = ({
  activeFilter,
  setActiveFilter,
  unlockedCount,
  totalAchievements,
}) => {
  const filters = [
    { id: "all", label: "All" },
    { id: "unlocked", label: "Unlocked" },
    { id: "locked", label: "Locked" },
  ] as const;

  // Calculate progress percentage safely, handling the case when totalAchievements is zero
  const progressPercentage =
    totalAchievements > 0
      ? Math.round((unlockedCount / totalAchievements) * 100)
      : 0;

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900  mb-4 sm:mb-0">
          Your Achievements
        </h2>

        <div className="  rounded-full shadow-sm p-1 inline-flex overflow-hidden">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === filter.id
                  ? "text-white"
                  : "text-gray-700  hover:text-gray-900 "
              }`}>
              {activeFilter === filter.id && (
                <motion.div
                  layoutId="activeFilter"
                  className="absolute inset-0 bg-[#E50046] rounded-full"
                  style={{ zIndex: -1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                />
              )}
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="  rounded-lg p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="mb-4 sm:mb-0">
            <p className="text-gray-600 ">
              You&apos;ve unlocked{" "}
              <span className="font-bold text-[#E50046]">{unlockedCount}</span>{" "}
              out of <span className="font-bold">{totalAchievements}</span>{" "}
              achievements
            </p>
          </div>

          <div className="w-full sm:w-64">
            <div className="flex justify-between mb-1 text-xs text-gray-600 ">
              <span>Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#E50046] h-2 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementFilters;
