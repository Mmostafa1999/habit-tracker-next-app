"use client";

import { useHabits } from "@/lib/context/HabitContext";
import {
  ArrowPathIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { format, isFuture, isToday, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import HabitActions from "./HabitActions";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import HabitEditModal from "./HabitEditModal";
import LoadingSpinner from "../ui/LoadingSpinner";

// Days of the week for selecting in weekly habits
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Modify the HabitList component to accept selectedDate prop
export default function HabitList({ selectedDate }: { selectedDate?: Date }) {
  const {
    todayHabits,
    habits,
    selectedCategory,
    toggleHabitCompletion,
    deleteHabit,
    updateHabit,
    categories,
    loading,
  } = useHabits();

  const [animatingHabit, setAnimatingHabit] = useState<string | null>(null);
  const [selectedDateHabits, setSelectedDateHabits] = useState<any[]>([]);

  // For delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<any | null>(null);

  // For edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<any | null>(null);

  // Get category color by category name
  const getCategoryColor = (categoryName: string): string => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.color || "#E50046"; // Default to primary color if not found
  };

  const isSelectedDateToday = selectedDate ? isToday(selectedDate) : true;
  const isSelectedDateFuture = selectedDate ? isFuture(selectedDate) : false;

  // Update habits when selectedDate changes
  useEffect(() => {
    if (!selectedDate) {
      // If no date is selected, use todayHabits (default behavior)
      setSelectedDateHabits(todayHabits);
      return;
    }

    // Filter habits based on selected date
    const dateString = format(selectedDate, "yyyy-MM-dd");
    const dayOfWeek = format(selectedDate, "EEE"); // 'Mon', 'Tue', etc.

    const habitsForDate = habits.filter(habit => {
      // For daily habits
      if (habit.frequency === "Daily") {
        return habit.date <= dateString;
      }

      // For weekly habits
      if (habit.frequency === "Weekly") {
        if (
          habit.date <= dateString &&
          habit.selectedDays &&
          habit.selectedDays.includes(dayOfWeek)
        ) {
          return true;
        }
        return false;
      }

      // For monthly habits
      if (habit.frequency === "Monthly") {
        const startDate = parseISO(habit.date);
        return (
          habit.date <= dateString &&
          startDate.getDate() === selectedDate.getDate()
        );
      }

      return false;
    });

    setSelectedDateHabits(habitsForDate);
  }, [selectedDate, habits, todayHabits]);

  // Filter habits based on selected category
  const filteredHabits =
    selectedCategory === "All"
      ? selectedDate
        ? selectedDateHabits
        : todayHabits
      : (selectedDate ? selectedDateHabits : todayHabits).filter(
        habit => habit.category === selectedCategory,
      );

  // Handle habit completion toggle with animation
  const handleToggleHabit = async (habitId: string) => {
    // Only allow toggling for today's habits
    if (!isSelectedDateToday) return;

    setAnimatingHabit(habitId);
    await toggleHabitCompletion(habitId);

    // Reset animation state after a delay
    setTimeout(() => {
      setAnimatingHabit(null);
    }, 600);
  };

  // Prepare to delete a habit (show confirmation)
  const handlePrepareDelete = (habit: any) => {
    // Only allow deletion for today's or past habits
    if (isSelectedDateFuture) return;

    setHabitToDelete(habit);
    setShowDeleteModal(true);
  };

  // Confirm habit deletion
  const handleConfirmDelete = async () => {
    if (habitToDelete) {
      await deleteHabit(habitToDelete.id);
      setShowDeleteModal(false);
      setHabitToDelete(null);
    }
  };

  // Edit a habit (show edit modal)
  const handleEditHabit = (habit: any) => {
    // Only allow editing for today's or past habits
    if (isSelectedDateFuture) return;

    setHabitToEdit(habit);
    setShowEditModal(true);
  };

  // Save edited habit
  const handleSaveHabit = async (updatedHabit: any) => {
    if (habitToEdit) {
      await updateHabit(habitToEdit.id, updatedHabit);
      setShowEditModal(false);
      setHabitToEdit(null);
    }
  };

  if (loading) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (filteredHabits.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center text-center p-8">
        <div className="bg-gray-100  rounded-full p-6 mb-4">
          <CalendarIcon className="h-12 w-12 text-gray-400 " />
        </div>
        <h3 className="text-xl font-medium text-gray-900  mb-2">
          No Habits Scheduled
        </h3>
        <p className="text-gray-500  max-w-md">
          {selectedDate && !isToday(selectedDate)
            ? `No habits scheduled for ${format(selectedDate, "MMMM d, yyyy")}.`
            : "You have no habits scheduled for today."}
        </p>
      </div>
    );
  }

  // Show future date notice if applicable
  const showFutureNotice = selectedDate && isSelectedDateFuture;

  return (
    <div className="mt-6 space-y-4">
      {showFutureNotice && (
        <div className="bg-gray-50  border border-gray-200  rounded-lg p-3 mb-4 flex items-center text-sm text-gray-600 ">
          <LockClosedIcon className="h-4 w-4 mr-2" />
          <span>
            Future habits are in read-only mode. You can only edit or mark
            habits as complete on today&apos;s date.
          </span>
        </div>
      )}

      {filteredHabits.map((habit, index) => (
        <div
          key={`${habit.id}-${index}`}
          className={`flex items-center justify-between bg-white p-4 rounded-lg shadow-md border-0 transition-shadow
                        ${isSelectedDateFuture ? "opacity-75" : "hover:shadow-lg"}`}>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleToggleHabit(habit.id)}
              disabled={!isSelectedDateToday}
              className={`
                                h-6 w-6 rounded-full flex items-center justify-center border-2
                                ${isSelectedDateToday ? "shadow-md hover:shadow-lg" : "opacity-60 cursor-not-allowed"}
                                transition-all duration-300 ease-in-out 
                                transform ${animatingHabit === habit.id ? "scale-110" : ""}
                                ${isSelectedDateToday && habit.isCompleted
                  ? "bg-[#E50046] border-[#E50046] text-white"
                  : "border-gray-300  bg-white  hover:border-[#E50046] hover:bg-pink-50 "
                }
                            `}
              aria-label={
                habit.isCompleted ? "Mark as incomplete" : "Mark as complete"
              }
              title={
                isSelectedDateToday
                  ? habit.isCompleted
                    ? "Mark as incomplete"
                    : "Mark as complete"
                  : "Can only mark habits complete on today&apos;s date"
              }>
              <CheckIcon
                className={`h-6 w-6 ${isSelectedDateToday && habit.isCompleted ? "opacity-100" : "opacity-0 group-hover:opacity-50"}`}
              />
            </button>
            <div className="flex-1">
              <h3
                className={`font-medium text-lg transition-all duration-300 ${isSelectedDateToday && habit.isCompleted ? "line-through text-gray-500 " : "text-gray-900 "}`}>
                {habit.title}
              </h3>
              <div className="flex items-center mt-1 text-xs text-gray-500 ">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full mr-1"
                  style={{ backgroundColor: getCategoryColor(habit.category) }}></span>
                <span>{habit.category}</span>
                <span className="mx-2">•</span>
                <ClockIcon className="h-3 w-3 mr-1" />
                <span>{format(parseISO(habit.date), "MMM d")}</span>
                <span className="mx-2">•</span>
                <ArrowPathIcon className="h-3 w-3 mr-1" />
                <span>{habit.frequency}</span>
                {habit.frequency === "Weekly" && habit.selectedDays && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{habit.selectedDays.join(", ")}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {isSelectedDateFuture ? (
            <div className="flex items-center px-2 py-1 text-xs text-gray-500  border border-gray-200  rounded">
              <LockClosedIcon className="h-3 w-3 mr-1" />
              <span>Future</span>
            </div>
          ) : (
            <HabitActions
              onEdit={() => handleEditHabit(habit)}
              onDelete={() => handlePrepareDelete(habit)}
            />
          )}
        </div>
      ))}

      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        habitTitle={habitToDelete?.title || ""}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Edit habit modal */}
      <HabitEditModal
        isOpen={showEditModal}
        habit={habitToEdit}
        categories={categories}
        onSave={handleSaveHabit}
        onCancel={() => {
          setShowEditModal(false);
          setHabitToEdit(null);
        }}
      />
    </div>
  );
}
