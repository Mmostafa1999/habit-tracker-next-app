'use client';

import { useAchievements } from '@/lib/context/AchievementContext';
import { useHabits } from '@/lib/context/HabitContext';
import { motion } from 'framer-motion';

export default function AchievementStats() {
    const { habits } = useHabits();
    const { achievements, unlockedCount, totalAchievements } = useAchievements();

    // Calculate statistics
    const totalCompletions = habits.reduce((sum, habit) => sum + (habit.completedCount || 0), 0);
    const maxStreak = Math.max(...habits.map(habit => habit.currentStreak || 0), 0);
    const maxLifetimeStreak = Math.max(...habits.map(habit => habit.bestStreak || 0), 0);
    const totalXP = achievements
        .filter(a => a.unlocked)
        .reduce((sum, a) => sum + (a.xp || 0), 0);

    // Count unique categories
    const uniqueCategories = new Set(habits.map(habit => habit.category)).size;

    const stats = [
        { label: 'Achievements', value: `${unlockedCount} / ${totalAchievements}` },
        { label: 'Completions', value: totalCompletions },
        { label: 'Current Streak', value: maxStreak },
        { label: 'Best Streak', value: maxLifetimeStreak },
        { label: 'Categories', value: uniqueCategories },
        { label: 'Total XP', value: totalXP },
    ];

    return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">Achievement Stats</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        className="bg-gray-50 rounded-lg p-3 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className="text-xl font-bold text-indigo-600">{stat.value}</div>
                        <div className="text-sm text-gray-500">{stat.label}</div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
} 