"use client";

import CategoryFilters from "@/components/habits/CategoryFilters";
import DashboardHeader from "@/components/layout/DashboardHeader";
import UserProfile from "@/components/layout/UserProfile";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/lib/context/AuthContext";
import { HabitProvider, useHabits } from "@/lib/context/HabitContext";
import { PlusIcon } from "@heroicons/react/24/solid";
import { format } from "date-fns";
import { Suspense, lazy, useEffect, useState } from "react";

// Lazy loaded components
const HabitList = lazy(() => import("@/components/habits/HabitList"));
const NewHabitModal = lazy(() => import("@/components/modals/NewHabitModal"));
const CategoryManagerModal = lazy(
  () => import("@/components/modals/CategoryManagerModal"),
);


// Dashboard wrapper to use HabitContext
export default function DashboardPage() {
  return (
    <HabitProvider>
      <DashboardContent />
    </HabitProvider>
  );
}

function DashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const { todayHabits, loading: habitsLoading } = useHabits();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isNewHabitModalOpen, setIsNewHabitModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Check if all today's habits are completed
  useEffect(() => {
    if (todayHabits.length > 0 && !habitsLoading) {
      const allCompleted = todayHabits.every(habit => habit.isCompleted);

      if (allCompleted) {
        // Get the current date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        // Get the key for today's modal tracking
        const storageKey = `habits-completed-${today}`;

        // Check if we've already shown the modal today
        const hasShownModalToday = localStorage.getItem(storageKey);

        if (!hasShownModalToday) {
          
          localStorage.setItem(storageKey, 'true');
        }
      }
    }
  }, [todayHabits, habitsLoading]);

  // Handler for when a date is selected in UserProfile
  const handleDateSelected = (date: Date) => {
    setSelectedDate(date);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login page happens automatically via middleware
    return null;
  }

  return (
    <>
      {/* Header */}
      <DashboardHeader />


      {/* Main Dashboard Content */}
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 ">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h1>

            <div className="flex space-x-2">
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-[#E50046] text-white rounded-md hover:bg-[#D00040] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E50046] transition-colors">
                Manage Categories
              </button>
              <button
                onClick={() => setIsNewHabitModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-[#E50046] text-white rounded-md hover:bg-[#D00040] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E50046] transition-colors">
                <PlusIcon className="h-5 w-5 mr-1" />
                New Habit
              </button>
            </div>
          </div>

          {/* Category Filters */}
          <CategoryFilters />

          {/* Habit List */}
          <Suspense
            fallback={
              <div className="mt-6 flex justify-center">
                <LoadingSpinner size="lg" />
              </div>
            }>
            <HabitList selectedDate={selectedDate} />
          </Suspense>
        </main>

        {/* User Profile */}
        <UserProfile onDateSelected={handleDateSelected} />
      </div>

      {/* Modals */}
      {isNewHabitModalOpen && (
        <Suspense fallback={null}>
          <NewHabitModal
            isOpen={isNewHabitModalOpen}
            onClose={() => setIsNewHabitModalOpen(false)}
            onManageCategories={() => {
              setIsNewHabitModalOpen(false);
              setIsCategoryModalOpen(true);
            }}
          />
        </Suspense>
      )}

      {isCategoryModalOpen && (
        <Suspense fallback={null}>
          <CategoryManagerModal
            isOpen={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
          />
        </Suspense>
      )}

    
    </>
  );
}
