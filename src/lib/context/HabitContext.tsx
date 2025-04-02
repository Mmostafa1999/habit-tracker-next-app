'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Category, Habit } from '../types';
import { useAuth } from './AuthContext';
import { getHabitService } from '../services/serviceFactory';
import { hasData } from '../services/serviceFactory';
import {
    adaptServiceHabitToUIHabit,
    adaptUIHabitToServiceHabit,
    adaptServiceCategoryToUICategory
} from '../utils/typeAdapters';

// HabitContext type definition
type HabitContextType = {
    habits: Habit[];
    todayHabits: Habit[];
    loading: boolean;
    error: string | null;
    selectedCategory: string;
    categories: Category[];
    setSelectedCategory: (category: string) => void;
    addHabit: (habit: Omit<Habit, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
    updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
    deleteHabit: (id: string) => Promise<void>;
    toggleHabitCompletion: (id: string) => Promise<void>;
    getCompletionPercentage: () => number;
    addCategory: (name: string, color: string) => Promise<void>;
    updateCategory: (id: string, name: string) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
    getHabitOccurrences: (habit: Habit, count?: number) => string[];
};

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export function HabitProvider({ children }: { children: React.ReactNode }) {
    // State management
    const [habits, setHabits] = useState<Habit[]>([]);
    const [todayHabits, setTodayHabits] = useState<Habit[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const habitService = getHabitService();

    // Apply loading cursor style when loading state is true
    useEffect(() => {
        if (loading) {
            document.body.style.cursor = 'not-allowed';
        } else {
            document.body.style.cursor = 'default';
        }

        return () => {
            document.body.style.cursor = 'default';
        };
    }, [loading]);

    // Fetch data when user changes
    useEffect(() => {
        if (!user) {
            setHabits([]);
            setTodayHabits([]);
            setCategories([]);
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch habits
                const habitsResult = await habitService.getHabits(user.uid);
                if (hasData(habitsResult)) {
                    // Convert service habits to UI habits
                    const uiHabits = habitsResult.data.map(habit =>
                        adaptServiceHabitToUIHabit(habit)
                    );
                    setHabits(uiHabits);
                } else if (habitsResult.error) {
                    setError(habitsResult.error.message);
                }

                // Fetch categories
                const categoriesResult = await habitService.getCategories(user.uid);
                if (hasData(categoriesResult)) {
                    // Convert service categories to UI categories
                    const uiCategories = categoriesResult.data.map(cat =>
                        adaptServiceCategoryToUICategory(cat)
                    );

                    setCategories([
                        { id: 'all', name: 'All', color: '#6366F1' },
                        ...uiCategories
                    ]);
                } else if (categoriesResult.error) {
                    setError(categoriesResult.error.message);
                }

                // Get today's habits
                const todayResult = await habitService.getTodayHabits(user.uid);
                if (hasData(todayResult)) {
                    // Convert service habits to UI habits
                    const todayUiHabits = todayResult.data.map(habit =>
                        adaptServiceHabitToUIHabit(habit)
                    );
                    setTodayHabits(todayUiHabits);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Function implementations using the service layer
    const addHabit = async (habitData: Omit<Habit, 'id' | 'userId' | 'createdAt'>) => {
        if (!user) return;

        try {
            setLoading(true);
            // Create a UI habit with required fields
            const fullHabitData = {
                ...habitData,
                id: '', // This will be assigned by Firestore
                userId: user.uid,
                createdAt: { toDate: () => new Date() }, // Mock Timestamp for the adapter
                date: habitData.date || new Date().toISOString().split('T')[0], // Ensure date exists
                // Ensure selectedDays is always defined based on frequency
                selectedDays: habitData.selectedDays ||
                    (habitData.frequency === 'Weekly' ? ['Mon', 'Wed', 'Fri'] :
                        habitData.frequency === 'Monthly' ? ['1', '15'] : [])
            };

            // Convert to a service-compatible format with explicitly defined days
            const serviceHabitData = {
                name: fullHabitData.title,
                category: fullHabitData.category,
                frequency: {
                    type: fullHabitData.frequency.toLowerCase(),
                    // Convert days based on frequency type
                    days: fullHabitData.frequency === 'Weekly'
                        ? fullHabitData.selectedDays.map(day => {
                            const dayMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
                            return dayMap[day as keyof typeof dayMap] || 0;
                        })
                        : fullHabitData.frequency === 'Monthly'
                            ? fullHabitData.selectedDays.map(day => parseInt(day, 10))
                            : [0] // Default to Sunday for Daily habits to avoid undefined
                },
                userId: user.uid,
                isCompleted: false,
                completedDates: []
            };


            // Cast to the expected type structure with all required fields guaranteed
            const result = await habitService.createHabit(user.uid, serviceHabitData as Omit<Habit, "id">);

            if (hasData(result)) {
                // Convert back to UI habit and update state
                const newUiHabit = adaptServiceHabitToUIHabit(result.data);

                // Update habits list
                setHabits(prev => [newUiHabit, ...prev]);

                // Check if this habit should appear in today's habits
                const today = new Date();
                const shouldShowToday = shouldHabitOccurOnDate(newUiHabit, today);

                if (shouldShowToday) {
                    setTodayHabits(prev => [newUiHabit, ...prev]);
                }
            } else if (result.error) {
                console.error('Error adding habit:', result.error);
                setError(result.error.message);
            }
        } catch (err) {
            console.error('Exception adding habit:', err);
            setError(err instanceof Error ? err.message : 'Failed to add habit');
        } finally {
            setLoading(false);
        }
    };

    const updateHabit = async (id: string, updates: Partial<Habit>) => {
        if (!user) return;

        try {
            setLoading(true);
            // Find the existing habit
            const existingHabit = habits.find(h => h.id === id);
            if (!existingHabit) {
                throw new Error(`Habit with ID ${id} not found`);
            }

            // Convert UI habit updates to service habit updates
            const serviceUpdates = adaptUIHabitToServiceHabit({
                ...existingHabit,
                ...updates
            });

            const result = await habitService.updateHabit(user.uid, id, serviceUpdates);
            if (hasData(result)) {
                // Convert back to UI habit and update state
                const updatedUiHabit = adaptServiceHabitToUIHabit(result.data);
                setHabits(prev => prev.map(h => h.id === id ? updatedUiHabit : h));

                // Refresh today's habits if necessary
                const todayResult = await habitService.getTodayHabits(user.uid);
                if (hasData(todayResult)) {
                    const todayUiHabits = todayResult.data.map(h =>
                        adaptServiceHabitToUIHabit(h)
                    );
                    setTodayHabits(todayUiHabits);
                }
            } else if (result.error) {
                setError(result.error.message);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update habit');
        } finally {
            setLoading(false);
        }
    };

    const deleteHabit = async (id: string) => {
        if (!user) return;

        try {
            setLoading(true);
            const result = await habitService.deleteHabit(user.uid, id);
            if (result.result === 'SUCCESS') {
                setHabits(prev => prev.filter(h => h.id !== id));
                setTodayHabits(prev => prev.filter(h => h.id !== id));
            } else if (result.error) {
                setError(result.error.message);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete habit');
        } finally {
            setLoading(false);
        }
    };

    const toggleHabitCompletion = async (id: string) => {
        if (!user) return;

        try {
            setLoading(true);
            const habit = habits.find(h => h.id === id);
            if (!habit) return;

            const today = new Date().toISOString().split('T')[0];
            const isCompleted = !habit.isCompleted;

            // Update the UI immediately for better UX
            const updatedHabit = { ...habit, isCompleted };
            setHabits(prev => prev.map(h => h.id === id ? updatedHabit : h));
            setTodayHabits(prev => prev.map(h => h.id === id ? updatedHabit : h));

            // Send the update to the service
            const result = await habitService.toggleHabitCompletion(
                user.uid,
                id,
                today,
                isCompleted
            );

            if (hasData(result)) {
                // Update with the service response data
                const updatedUiHabit = adaptServiceHabitToUIHabit(result.data);
                setHabits(prev => prev.map(h => h.id === id ? updatedUiHabit : h));
                setTodayHabits(prev => prev.map(h => h.id === id ? updatedUiHabit : h));
            } else if (result.error) {
                // Revert the UI update if there was an error
                setError(result.error.message);
                setHabits(prev => [...prev]); // Force refresh
                setTodayHabits(prev => [...prev]); // Force refresh
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to toggle habit completion');
        } finally {
            setLoading(false);
        }
    };

    const getCompletionPercentage = (): number => {
        if (todayHabits.length === 0) return 0;

        const completedCount = todayHabits.filter(habit => habit.isCompleted).length;
        return Math.round((completedCount / todayHabits.length) * 100);
    };

    const addCategory = async (name: string, color: string) => {
        if (!user) return null;

        try {
            const result = await habitService.createCategory(user.uid, { name, color });
            if (hasData(result)) {
                const newUiCategory = adaptServiceCategoryToUICategory(result.data);
                setCategories(prev => [...prev, newUiCategory]);
            } else if (result.error) {
                setError(result.error.message);
            }
            return result;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add category');
            throw err;
        }
    };

    const updateCategory = async (id: string, name: string) => {
        if (!user) return;

        try {
            const result = await habitService.updateCategory(user.uid, id, { name });
            if (hasData(result)) {
                const updatedUiCategory = adaptServiceCategoryToUICategory(result.data);
                setCategories(prev => prev.map(c => c.id === id ? updatedUiCategory : c));
            } else if (result.error) {
                setError(result.error.message);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update category');
        }
    };

    const deleteCategory = async (id: string) => {
        if (!user) return;

        try {
            // Set loading state to indicate the operation is in progress
            setLoading(true);

            // Find the category to get its name before deletion
            const categoryToDelete = categories.find(c => c.id === id);
            if (!categoryToDelete) return;

            const result = await habitService.deleteCategory(user.uid, id);
            if (result.result === 'SUCCESS') {
                // Remove the category from local state
                setCategories(prev => prev.filter(c => c.id !== id));

                // Also remove all habits that belonged to this category
                setHabits(prev => prev.filter(h => h.category !== categoryToDelete.name));
                setTodayHabits(prev => prev.filter(h => h.category !== categoryToDelete.name));

                // Set selectedCategory to 'All' if the deleted category was selected
                if (selectedCategory === categoryToDelete.name) {
                    setSelectedCategory('All');
                }
            } else if (result.error) {
                setError(result.error.message);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete category');
        } finally {
            setLoading(false);
        }
    };

    const getHabitOccurrences = (habit: Habit, count = 10): string[] => {
        // Local implementation as this doesn't require a service call
        if (!habit.frequency) return [];

        const dates: string[] = [];
        const today = new Date();
        const currentDate = new Date(today);

        for (let i = 0; i < count; i++) {
            // Convert to YYYY-MM-DD
            const dateString = currentDate.toISOString().split('T')[0];

            // Check if habit occurs on this date based on frequency
            if (shouldHabitOccurOnDate(habit, currentDate)) {
                dates.push(dateString);
            }

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dates;
    };

    // Helper function to determine if a habit should occur on a given date
    const shouldHabitOccurOnDate = (habit: Habit, date: Date): boolean => {
        const { frequency } = habit;
        if (!frequency) return false;

        switch (frequency) {
            case 'Daily':
                return true;

            case 'Weekly':
                // Check if the day of week is in the selected days array
                const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
                return habit.selectedDays?.includes(dayOfWeek) || false;

            case 'Monthly':
                // Check if the day of month is in the selected days array
                const dayOfMonth = date.getDate().toString();
                return habit.selectedDays?.includes(dayOfMonth) || false;

            default:
                return false;
        }
    };

    // Context value
    const contextValue: HabitContextType = {
        habits,
        todayHabits,
        loading,
        error,
        selectedCategory,
        categories,
        setSelectedCategory,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleHabitCompletion,
        getCompletionPercentage,
        addCategory,
        updateCategory,
        deleteCategory,
        getHabitOccurrences
    };

    return (
        <HabitContext.Provider value={contextValue}>
            {children}
        </HabitContext.Provider>
    );
}

// Hook for consuming the context
export function useHabits() {
    const context = useContext(HabitContext);
    if (context === undefined) {
        throw new Error('useHabits must be used within a HabitProvider');
    }
    return context;
}
