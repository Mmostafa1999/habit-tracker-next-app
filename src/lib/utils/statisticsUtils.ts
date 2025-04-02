// statisticsUtils.ts
import { addDays, format, parseISO, startOfDay, subDays } from "date-fns";
import { Category, Habit } from "../context/HabitContext";

export type TimeRange = "7days" | "30days" | "90days" | "all";

export interface CategoryStat {
  name: string;
  count: number;
  completedCount: number;
  completionRate: number;
  color: string;
}

export interface DateCompletionData {
  date: string;
  completed: number;
  total: number;
  rate: number;
}

export function getCompletionRate(habits: Habit[], timeRange: TimeRange): number {
  const { filteredHabits, completedHabits } = filterHabitsByTimeRange(habits, timeRange);
  return filteredHabits.length === 0 ? 0 : Math.round((completedHabits.length / filteredHabits.length) * 100);
}

export function getCurrentStreak(habits: Habit[]): number {
  if (!habits.length) return 0;

  const sortedHabits = [...habits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  let currentDate = startOfDay(new Date());

  while (true) {
    const formattedDate = format(currentDate, "yyyy-MM-dd");
    const habitsForDay = sortedHabits.filter(h => h.date === formattedDate);

    if (!habitsForDay.length || !habitsForDay.every(h => h.isCompleted)) break;
    streak++;
    currentDate = subDays(currentDate, 1);
  }

  return streak;
}

export function getStatsByCategory(habits: Habit[], categories: Category[], timeRange: TimeRange): CategoryStat[] {
  const { filteredHabits } = filterHabitsByTimeRange(habits, timeRange);

  return categories
    .filter(category => category.id !== "all")
    .map(category => {
      const categoryHabits = filteredHabits.filter(h => h.category === category.name);
      const completedHabits = categoryHabits.filter(h => h.isCompleted);
      return {
        name: category.name,
        count: categoryHabits.length,
        completedCount: completedHabits.length,
        completionRate: categoryHabits.length ? Math.round((completedHabits.length / categoryHabits.length) * 100) : 0,
        color: category.color.replace("bg-", ""),
      };
    })
    .filter(stat => stat.count > 0)
    .sort((a, b) => b.completionRate - a.completionRate);
}

export function getDailyCompletionData(habits: Habit[], timeRange: TimeRange): DateCompletionData[] {
  const days = timeRangeToDays(timeRange);
  const startDate = subDays(new Date(), days);

  return Array.from({ length: days + 1 }, (_, i) => {
    const currentDate = addDays(startDate, i);
    const formattedDate = format(currentDate, "yyyy-MM-dd");

    const habitsForDay = habits.filter(h =>
      (h.frequency === "Daily" && h.date <= formattedDate) ||
      (h.frequency === "Weekly" && h.date <= formattedDate && h.selectedDays?.includes(format(currentDate, "EEE"))) ||
      (h.frequency === "Monthly" && h.date <= formattedDate && parseISO(h.date).getDate() === currentDate.getDate())
    );

    const completedHabits = habitsForDay.filter(h => h.isCompleted);
    return {
      date: formattedDate,
      completed: completedHabits.length,
      total: habitsForDay.length,
      rate: habitsForDay.length ? Math.round((completedHabits.length / habitsForDay.length) * 100) : 0,
    };
  });
}

export function getBestAndWorstHabits(habits: Habit[], timeRange: TimeRange) {
  const { filteredHabits } = filterHabitsByTimeRange(habits, timeRange);

  const habitStats = Object.values(
    filteredHabits.reduce<Record<string, { habit: Habit; completed: number; total: number }>>((acc, habit) => {
      if (!acc[habit.title]) acc[habit.title] = { habit, completed: 0, total: 0 };
      acc[habit.title].total++;
      if (habit.isCompleted) acc[habit.title].completed++;
      return acc;
    }, {})
  ).map(({ habit, completed, total }) => ({ habit, completionRate: Math.round((completed / total) * 100) }));

  const sortedStats = habitStats.sort((a, b) => b.completionRate - a.completionRate);
  return { best: sortedStats.slice(0, 3), worst: sortedStats.slice(-3) };
}

function filterHabitsByTimeRange(habits: Habit[], timeRange: TimeRange) {
  const days = timeRangeToDays(timeRange);
  const cutoffDate = format(subDays(new Date(), days), "yyyy-MM-dd");
  const filteredHabits = timeRange === "all" ? habits : habits.filter(h => h.date >= cutoffDate);
  return { filteredHabits, completedHabits: filteredHabits.filter(h => h.isCompleted) };
}

function timeRangeToDays(timeRange: TimeRange): number {
  return { "7days": 7, "30days": 30, "90days": 90, "all": 365 }[timeRange] || 7;
}
