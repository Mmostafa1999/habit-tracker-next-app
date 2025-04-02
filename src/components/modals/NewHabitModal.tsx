"use client";

import {
  HabitCategory,
  HabitFrequency,
  useHabits,
} from "@/lib/context/HabitContext";
import { Cog6ToothIcon, XMarkIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useState } from "react";

type NewHabitModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onManageCategories: () => void;
};

// Days of the week for selecting in weekly habits
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function NewHabitModal({
  isOpen,
  onClose,
  onManageCategories,
}: NewHabitModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<HabitCategory>("Health");
  const [frequency, setFrequency] = useState<HabitFrequency>("Daily");
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "Mon",
    "Wed",
    "Fri",
  ]); // Default selection
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enableReminder, setEnableReminder] = useState(false);

  const { addHabit, categories } = useHabits();

  // Get user-defined categories (excluding the "All" category which is just for filtering)
  const userCategories = categories.filter(cat => cat.id !== "all" && cat.id !== "system-all");

  // Get today's date in YYYY-MM-DD format for date input min attribute
  const today = new Date().toISOString().split("T")[0];

  // Reset category if it no longer exists in the list
  useEffect(() => {
    if (
      userCategories.length > 0 &&
      !userCategories.some(cat => cat.name === category)
    ) {
      setCategory(userCategories[0].name as HabitCategory);
    }
  }, [userCategories, category]);

  // Toggle a day in the selectedDays array
  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    setIsSubmitting(true);

    try {
      // Ensure default selections for Monthly frequency
      let daysForSubmission = selectedDays;

      // For Monthly frequency, use default days if none selected
      if (frequency === "Monthly" && (!selectedDays || selectedDays.length === 0)) {
        daysForSubmission = ["1", "15"]; // Default to 1st and 15th of month
      }

      // For Weekly frequency, ensure at least one day is selected
      if (frequency === "Weekly" && (!selectedDays || selectedDays.length === 0)) {
        daysForSubmission = ["Mon"]; // Default to Monday if no days selected
      }

      await addHabit({
        title,
        category: category as HabitCategory,
        frequency,
        // Always include selectedDays, but with appropriate values based on frequency
        selectedDays: daysForSubmission,
        date,
        isCompleted: false,
        enableReminder: enableReminder,
      });

      // Reset form and close modal
      setTitle("");
      setCategory("Health");
      setFrequency("Daily");
      setSelectedDays(["Mon", "Wed", "Fri"]);
      setDate(new Date().toISOString().split("T")[0]);
      setEnableReminder(false);
      onClose();
    } catch (error) {
      console.error("Error adding habit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          aria-hidden="true"
          onClick={onClose}></div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ">
          <div className="px-4 pt-5 pb-4 bg-white  sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900 ">
                Add New Habit
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700  mb-1">
                  Habit Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E50046] focus:border-transparent "
                  placeholder="e.g., Morning Meditation"
                  required
                />
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 ">
                    Category
                  </label>
                  <button
                    type="button"
                    onClick={e => {
                      e.preventDefault();
                      onManageCategories();
                    }}
                    className="text-sm font-medium text-[#E50046] hover:text-[#D00040] flex items-center underline transition duration-150 ease-in-out">
                    <Cog6ToothIcon className="h-4 w-4 mr-1" />
                    Manage Categories
                  </button>
                </div>
                <select
                  id="category"
                  value={category}
                  onChange={e => setCategory(e.target.value as HabitCategory)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E50046] focus:border-transparent ">
                  {userCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="frequency"
                  className="block text-sm font-medium text-gray-700  mb-1">
                  Frequency
                </label>
                <select
                  id="frequency"
                  value={frequency}
                  onChange={e => {
                    const newFreq = e.target.value as HabitFrequency;
                    setFrequency(newFreq);
                    
                    // Set appropriate default days based on new frequency
                    if (newFreq === "Weekly") {
                      setSelectedDays(["Mon", "Wed", "Fri"]);
                    } else if (newFreq === "Monthly") {
                      setSelectedDays(["1", "15"]);
                    } else {
                      setSelectedDays([]);
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E50046] focus:border-transparent ">
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>

              {/* Day selection for weekly habits */}
              {frequency === "Weekly" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Schedule (select days)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`h-10 w-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${selectedDays.includes(day)
                          ? "bg-[#E50046] text-white"
                          : "bg-gray-100 text-gray-700 "
                          }`}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Day selection for monthly habits */}
              {frequency === "Monthly" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700  mb-2">
                    Schedule (select days of month)
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2">
                    {Array.from({ length: 31 }, (_, i) => String(i + 1)).map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`h-10 w-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${selectedDays.includes(day)
                          ? "bg-[#E50046] text-white"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          }`}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  min={today} // Set min attribute to today to prevent past dates
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E50046] focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="enableReminder"
                  checked={enableReminder}
                  onChange={e => setEnableReminder(e.target.checked)}
                  className="h-4 w-4 text-[#E50046] focus:ring-[#E50046] border-gray-300 rounded"
                />
                <label
                  htmlFor="enableReminder"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Enable Daily Reminder
                </label>
              </div>

              <div className="flex justify-end mt-6 space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !title.trim() ||
                    (frequency === "Weekly" && selectedDays.length === 0)
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-[#E50046] border border-transparent rounded-md hover:bg-[#D00040] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E50046] disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? "Adding..." : "Add Habit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
