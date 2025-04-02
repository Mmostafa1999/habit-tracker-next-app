'use client';

import React, { createContext, useContext, useEffect, useCallback, useState, useRef } from 'react';
import { orderBy, collection, onSnapshot, query, getDocs, Unsubscribe } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useHabits } from './HabitContext';
import { Achievement } from '../types';
import { db } from '../firebase/config';
import {
  initializeAchievements,
  syncAchievementsWithHabits
} from '../utils/achievementUtils';

// Context type
type AchievementContextType = {
  achievements: Achievement[];
  loading: boolean;
  error: string | null;
  unlockedCount: number;
  totalAchievements: number;
  refreshAchievements: () => Promise<void>;
  syncWithHabits: () => Promise<void>;
  filterAchievements: (filter: 'all' | 'unlocked' | 'locked') => Achievement[];
};

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export function AchievementProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { habits } = useHabits();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isRefreshing = useRef(false);
  const currentAchievementsRef = useRef<Map<string, Achievement>>(new Map());
  const updateScheduled = useRef<boolean>(false);

  // Function that compares two arrays of achievements
  const achievementsChanged = (newAchievements: Achievement[]): boolean => {
    if (newAchievements.length !== achievements.length) return true;

    const currentIds = new Set(achievements.map(a => a.id));
    const newIds = new Set(newAchievements.map(a => a.id));

    // Check if IDs match
    if (currentIds.size !== newIds.size) return true;
    for (const id of currentIds) {
      if (!newIds.has(id)) return true;
    }

    // Check if any achievement's unlocked status has changed
    for (const newAchievement of newAchievements) {
      const existingAchievement = achievements.find(a => a.id === newAchievement.id);
      if (!existingAchievement || existingAchievement.unlocked !== newAchievement.unlocked) {
        return true;
      }
    }

    return false;
  };

  // Function to batch state updates
  const scheduleStateUpdate = (newAchievements: Achievement[]) => {
    if (updateScheduled.current) return;

    if (achievementsChanged(newAchievements)) {
      updateScheduled.current = true;

      // Schedule the update in the next tick to prevent rapid consecutive updates
      setTimeout(() => {
        setAchievements(newAchievements);
        setLoading(false);
        updateScheduled.current = false;
        isRefreshing.current = false;
      }, 0);
    } else {
      setLoading(false);
      isRefreshing.current = false;
    }
  };

  // Function to fetch achievements with deduplication
  const fetchAchievements = useCallback(async (): Promise<Unsubscribe | undefined> => {
    if (!user?.uid) return undefined;
    if (isRefreshing.current) return undefined;

    isRefreshing.current = true;
    setLoading(true);

    try {
      // Create a reference to the achievements collection
      const achievementsRef = collection(db, "users", user.uid, "achievements");
      const achievementsQuery = query(achievementsRef, orderBy('createdAt', 'asc'));

      // Get achievements snapshot
      const snapshot = await getDocs(achievementsQuery);

      // Check if achievements exist, initialize if not
      if (snapshot.empty) {
        await initializeAchievements(user.uid);
        // Fetch will continue through the onSnapshot
      }

      // Create unsubscriber for real-time updates
      const unsubscribe = onSnapshot(achievementsQuery, (snapshot) => {
        const uniqueAchievements = new Map<string, Achievement>();

        snapshot.docs.forEach(doc => {
          const achievement = {
            id: doc.id,
            ...doc.data()
          } as Achievement;

          // Only add if not already in the map
          uniqueAchievements.set(doc.id, achievement);
        });

        // Convert map to array and store in ref for comparison
        const uniqueAchievementsArray = Array.from(uniqueAchievements.values());
        currentAchievementsRef.current = uniqueAchievements;

        // Schedule state update carefully
        scheduleStateUpdate(uniqueAchievementsArray);
      }, (err: Error) => {
        console.error("Error fetching achievements:", err);
        setError(err.message);
        setLoading(false);
        isRefreshing.current = false;
      });

      // Cleanup function
      return () => {
        unsubscribe();
        isRefreshing.current = false;
      };
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Error setting up achievements listener:", error);
      setError(error.message);
      setLoading(false);
      isRefreshing.current = false;
      return undefined;
    }
  }, [user?.uid]);

  // Fetch achievements on mount or user change
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    if (user?.uid) {
      fetchAchievements().then(unsub => {
        unsubscribe = unsub;
      }).catch(error => {
        console.error("Error in fetchAchievements:", error);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid, fetchAchievements]);

  // Memoize the update function to prevent it from causing re-renders
  const updateAchievements = useCallback(async () => {
    if (!user?.uid || loading || !achievements.length || !habits.length || isRefreshing.current) return;

    try {
      // Use the new sync function instead of just processing
      const updatedAchievements = await syncAchievementsWithHabits(user.uid, habits, achievements);

      // Update state if achievements have changed
      if (achievementsChanged(updatedAchievements)) {
        scheduleStateUpdate(updatedAchievements);
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Error syncing achievements with habits:", error);
      setError(error.message);
    }
  }, [user?.uid, habits, achievements, loading]);

  // Explicit function to sync achievements with habits
  const syncWithHabits = useCallback(async () => {
    if (!user?.uid || !habits.length || !achievements.length) return;

    setLoading(true);
    try {
      const updatedAchievements = await syncAchievementsWithHabits(user.uid, habits, achievements);

      // Update state with synced achievements
      if (achievementsChanged(updatedAchievements)) {
        scheduleStateUpdate(updatedAchievements);
      } else {
        setLoading(false);
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Error during manual achievement sync:", error);
      setError(error.message);
      setLoading(false);
    }
  }, [user?.uid, habits, achievements]);

  // Update achievements based on user activity
  useEffect(() => {
    if (user?.uid && achievements.length > 0 && habits.length > 0 && !loading && !isRefreshing.current) {
      updateAchievements();
    }
  }, [user?.uid, achievements.length, habits.length, loading, updateAchievements]);

  // Manual refresh function for explicit updates
  const refreshAchievements = useCallback(async () => {
    if (isRefreshing.current) return;
    await fetchAchievements();
  }, [fetchAchievements]);

  // Calculate counts
  const unlockedCount = achievements.filter(achievement => achievement.unlocked).length;
  const totalAchievements = achievements.length;

  // Filter achievements by status
  const filterAchievements = useCallback((filter: 'all' | 'unlocked' | 'locked'): Achievement[] => {
    if (filter === 'all') return achievements;
    if (filter === 'unlocked') return achievements.filter(a => a.unlocked);
    return achievements.filter(a => !a.unlocked);
  }, [achievements]);

  return (
    <AchievementContext.Provider
      value={{
        achievements,
        loading,
        error,
        unlockedCount,
        totalAchievements,
        refreshAchievements,
        syncWithHabits,
        filterAchievements,
      }}
    >
      {children}
    </AchievementContext.Provider>
  );
}

// Hook for consuming the context
export function useAchievements() {
  const context = useContext(AchievementContext);
  if (context === undefined) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
} 