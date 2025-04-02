"use client";

import DashboardHeader from "@/components/layout/DashboardHeader";
import UserProfile from "@/components/layout/UserProfile";
import CategoryChart from "@/components/stats/CategoryChart";
import CompletionRateChart from "@/components/stats/CompletionRateChart";
import DailyCompletionChart from "@/components/stats/DailyCompletionChart";
import HabitPerformance from "@/components/stats/HabitPerformance";
import StreakCounter from "@/components/stats/StreakCounter";
import TimeRangeSelector from "@/components/stats/TimeRangeSelector";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatsCard from "@/components/ui/StatsCard";
import { useAuth } from "@/lib/context/AuthContext";
import { HabitProvider, useHabits } from "@/lib/context/HabitContext";
import {
  TimeRange,
  getBestAndWorstHabits,
  getCompletionRate,
  getCurrentStreak,
  getDailyCompletionData,
  getStatsByCategory,
} from "@/lib/utils/statisticsUtils";
import { useState } from "react";

function StatisticsContent() {
  const { habits, categories, loading } = useHabits();
  const [selectedTimeRange, setSelectedTimeRange] =
    useState<TimeRange>("7days");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Calculate statistics based on the selected time range
  const completionRate = getCompletionRate(habits, selectedTimeRange);
  const streak = getCurrentStreak(habits);
  const categoryStats = getStatsByCategory(
    habits,
    categories,
    selectedTimeRange,
  );
  const dailyCompletionData = getDailyCompletionData(habits, selectedTimeRange);
  const { best, worst } = getBestAndWorstHabits(habits, selectedTimeRange);

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 ">
          Statistics
        </h1>
        <TimeRangeSelector
          selectedRange={selectedTimeRange}
          onChange={setSelectedTimeRange}
        />
      </div>

      {/* Main Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completion Rate */}
        <StatsCard title="Overall Completion Rate">
          <CompletionRateChart completionRate={completionRate} />
        </StatsCard>

        {/* Current Streak */}
        <StatsCard title="Current Streak">
          <StreakCounter streak={streak} />
        </StatsCard>
      </div>

      {/* Category Stats */}
      <StatsCard title="Completion Rate by Category">
        <CategoryChart categories={categoryStats} />
      </StatsCard>

      {/* Daily Completion Chart */}
      <StatsCard title="Daily Completion Trend">
        <DailyCompletionChart data={dailyCompletionData} />
      </StatsCard>

      {/* Habit Performance */}
      <StatsCard title="Habit Performance">
        <HabitPerformance best={best} worst={worst} />
      </StatsCard>
    </div>
  );
}

export default function StatisticsPage() {
  const { user, loading } = useAuth();

  if (loading) {
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
    <HabitProvider>
      <>
        <DashboardHeader />

        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">
            <StatisticsContent />
          </main>

          <UserProfile />
        </div>
      </>
    </HabitProvider>
  );
}
