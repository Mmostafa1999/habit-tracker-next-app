"use client";

import { useEffect, useState, useRef } from "react";
import AchievementFilters from "@/components/achievements/AchievementFilters";
import AchievementGrid from "@/components/achievements/AchievementGrid";
import AchievementSync from "@/components/achievements/AchievementSync";
import AchievementStats from "@/components/achievements/AchievementStats";
import DashboardHeader from "@/components/layout/DashboardHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  AchievementProvider,
  useAchievements,
} from "@/lib/context/AchievementContext";
import { useAuth } from "@/lib/context/AuthContext";
import { HabitProvider, useHabits } from "@/lib/context/HabitContext";

export default function AchievementsPage() {
  return (
    <HabitProvider>
      <AchievementProvider>
        <AchievementsContent />
      </AchievementProvider>
    </HabitProvider>
  );
}

function AchievementsContent() {
  const { user, loading: authLoading } = useAuth();
  const { loading: habitsLoading } = useHabits();
  const {
    loading: achievementsLoading,
    unlockedCount,
    totalAchievements,
    filterAchievements,
    syncWithHabits
  } = useAchievements();
  const [activeFilter, setActiveFilter] = useState<"all" | "unlocked" | "locked">("all");
  const initialLoadDone = useRef(false);

  useEffect(() => {
    // Only refresh on initial mount and when auth/habits are ready
    if (user && !habitsLoading && !initialLoadDone.current) {
      initialLoadDone.current = true;
      syncWithHabits().catch(err => {
        console.error("Error syncing achievements with habits:", err);
      });
    }
  }, [user, habitsLoading, syncWithHabits]);

  const filteredAchievements = filterAchievements(activeFilter);
  const isLoading = authLoading || achievementsLoading;

  if (authLoading || achievementsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <DashboardHeader />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Achievements</h1>
            <AchievementSync />
          </div>

          <AchievementStats />

          <div className="mb-6">
            <AchievementFilters
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              unlockedCount={unlockedCount}
              totalAchievements={totalAchievements}
            />
          </div>

          <AchievementGrid
            achievements={filteredAchievements}
            loading={isLoading}
          />
        </div>
      </div>
    </>
  );
}