/**
 * Context provider for habit management
 */
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Habit } from '../types';
import { Category } from '../services/habits/habitService';
import { useAuth } from './AuthContext';
import { getHabitService } from '../services/serviceFactory';
import { hasData } from '../services/serviceFactory';
import {
    adaptServiceHabitToUIHabit,
    adaptUIHabitToServiceHabit,
    adaptServiceCategoryToUICategory
} from '../utils/typeAdapters';
import { getCompletionPercentage, getHabitOccurrences, shouldHabitOccurOnDate } from '../utils/habitUtils';
import { processError } from '../utils/errorHandling';

// Interface for habit data when creating a new habit
interface NewHabitData {
    title: string;
    name?: string; // For compatibility with service layer
    description?: string;
    category: string;
    frequency: "Daily" | "Weekly" | "Monthly";
    selectedDays?: string[];
    date?: string;
    timeOfDay?: string;
    isCompleted?: boolean;
    completedDates?: string[];
    color?: string;
    icon?: string;
}

// HabitContext type definition
type HabitContextType = {
    habits: Habit[];
    todayHabits: Habit[];
    loading: boolean;
    error: string | null;
    selectedCategory: string;
    categories: Category[];
    setSelectedCategory: (category: string) => void;
    addHabit: (habit: NewHabitData) => Promise<void>;
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
                const errorInfo = processError(err, 'Failed to fetch habit data', false);
                setError(errorInfo.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Function to add a new habit
    const addHabit = async (habitData: NewHabitData) => {
        if (!user) return;

        try {
            setLoading(true);
            // Prepare the service data format
            const serviceHabitData = {
                // Service layer expects 'title' but UI uses 'name'
                title: habitData.title || habitData.name || '',
                category: habitData.category,
                frequency: habitData.frequency,
                selectedDays: habitData.selectedDays ||
                    (habitData.frequency === 'Weekly' ? ['Mon', 'Wed', 'Fri'] :
                        habitData.frequency === 'Monthly' ? ['1', '15'] : []),
                date: habitData.date || new Date().toISOString().split('T')[0],
                isCompleted: habitData.isCompleted || false,
                completedDates: habitData.completedDates || [],
                userId: user.uid,
                // Any other required fields from the service Habit interface
                createdAt: new Date().toISOString()
            };

            // Cast to the expected type structure with all required fields guaranteed
            const result = await habitService.createHabit(user.uid, serviceHabitData);

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
                const errorInfo = processError(result.error, 'Error adding habit', true);
                setError(errorInfo.message);
            }
        } catch (err) {
            const errorInfo = processError(err, 'Failed to add habit', true);
            setError(errorInfo.message);
        } finally {
            setLoading(false);
        }
    };

    // Function to update an existing habit
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
                const errorInfo = processError(result.error, 'Error updating habit', true);
                setError(errorInfo.message);
            }
        } catch (err) {
            const errorInfo = processError(err, 'Failed to update habit', true);
            setError(errorInfo.message);
        } finally {
            setLoading(false);
        }
    };

    // Function to delete a habit
    const deleteHabit = async (id: string) => {
        if (!user) return;

        try {
            setLoading(true);
            const result = await habitService.deleteHabit(user.uid, id);
            if (result.result === 'SUCCESS') {
                setHabits(prev => prev.filter(h => h.id !== id));
                setTodayHabits(prev => prev.filter(h => h.id !== id));
            } else if (result.error) {
                const errorInfo = processError(result.error, 'Error deleting habit', true);
                setError(errorInfo.message);
            }
        } catch (err) {
            const errorInfo = processError(err, 'Failed to delete habit', true);
            setError(errorInfo.message);
        } finally {
            setLoading(false);
        }
    };

    // Function to toggle habit completion status
    const toggleHabitCompletion = async (id: string) => {
        if (!user) return;

        try {
            // Find the habit to toggle
            const habitToUpdate = habits.find(h => h.id === id);
            if (!habitToUpdate) {
                throw new Error(`Habit with ID ${id} not found`);
            }

            // Get today's date in YYYY-MM-DD format
            const today = new Date().toISOString().split('T')[0];

            // Check if the habit is already completed for today
            const isCompletedToday = habitToUpdate.completedDates?.includes(today) || false;
            let updatedCompletedDates = [...(habitToUpdate.completedDates || [])];

            if (isCompletedToday) {
                // Remove today from completed dates if already completed
                updatedCompletedDates = updatedCompletedDates.filter(date => date !== today);
            } else {
                // Add today to completed dates if not completed
                updatedCompletedDates.push(today);
            }

            // Update the habit with new completion status and directly use the toggleHabitCompletion from the service
            const result = await habitService.toggleHabitCompletion(
                user.uid,
                id,
                today,
                !isCompletedToday
            );

            if (hasData(result)) {
                // Convert back to UI habit and update state
                const updatedUiHabit = adaptServiceHabitToUIHabit(result.data);
                setHabits(prev => prev.map(h => h.id === id ? updatedUiHabit : h));
                setTodayHabits(prev => prev.map(h => h.id === id ? updatedUiHabit : h));
            } else if (result.error) {
                const errorInfo = processError(result.error, 'Error toggling habit completion', true);
                setError(errorInfo.message);
            }
        } catch (err) {
            const errorInfo = processError(err, 'Failed to toggle habit completion', true);
            setError(errorInfo.message);
        }
    };

    // Calculate completion percentage for today's habits
    const calculateCompletionPercentage = (): number => {
        return getCompletionPercentage(todayHabits);
    };

    // Function to add a new category
    const addCategory = async (name: string, color: string) => {
        if (!user) return;

        try {
            setLoading(true);
            const result = await habitService.createCategory(user.uid, { name, color });
            if (hasData(result)) {
                const newCategory = adaptServiceCategoryToUICategory(result.data);
                setCategories(prev => [...prev, newCategory]);
            } else if (result.error) {
                const errorInfo = processError(result.error, 'Error adding category', true);
                setError(errorInfo.message);
            }
        } catch (err) {
            const errorInfo = processError(err, 'Failed to add category', true);
            setError(errorInfo.message);
        } finally {
            setLoading(false);
        }
    };

    // Function to update an existing category
    const updateCategory = async (id: string, name: string) => {
        if (!user) return;

        try {
            setLoading(true);
            const result = await habitService.updateCategory(user.uid, id, { name });
            if (hasData(result)) {
                const updatedCategory = adaptServiceCategoryToUICategory(result.data);
                setCategories(prev => prev.map(c => c.id === id ? updatedCategory : c));
            } else if (result.error) {
                const errorInfo = processError(result.error, 'Error updating category', true);
                setError(errorInfo.message);
            }
        } catch (err) {
            const errorInfo = processError(err, 'Failed to update category', true);
            setError(errorInfo.message);
        } finally {
            setLoading(false);
        }
    };

    // Function to delete a category
    const deleteCategory = async (id: string) => {
        if (!user) return;

        try {
            setLoading(true);
            // First check if there are habits using this category
            const habitsWithCategory = habits.filter(h => h.category === id);

            if (habitsWithCategory.length > 0) {
                // If there are habits, update them to use the default category
                for (const habit of habitsWithCategory) {
                    await habitService.updateHabit(user.uid, habit.id, {
                        ...adaptUIHabitToServiceHabit(habit),
                        category: 'default'
                    });
                }

                // Update habits in state
                setHabits(prev => prev.map(h =>
                    h.category === id ? { ...h, category: 'default' } : h
                ));
            }

            // Then delete the category
            const result = await habitService.deleteCategory(user.uid, id);
            if (result.result === 'SUCCESS') {
                setCategories(prev => prev.filter(c => c.id !== id));
            } else if (result.error) {
                const errorInfo = processError(result.error, 'Error deleting category', true);
                setError(errorInfo.message);
            }
        } catch (err) {
            const errorInfo = processError(err, 'Failed to delete category', true);
            setError(errorInfo.message);
        } finally {
            setLoading(false);
        }
    };

    // Wrapper for the utility function to get habit occurrences
    const getNextHabitOccurrences = (habit: Habit, count = 10): string[] => {
        return getHabitOccurrences(habit, count);
    };

    return (
        <HabitContext.Provider
            value={{
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
                getCompletionPercentage: calculateCompletionPercentage,
                addCategory,
                updateCategory,
                deleteCategory,
                getHabitOccurrences: getNextHabitOccurrences,
            }}
        >
            {children}
        </HabitContext.Provider>
    );
}

export function useHabits() {
    const context = useContext(HabitContext);
    if (context === undefined) {
        throw new Error('useHabits must be used within a HabitProvider');
    }
    return context;
}
