"use client";

import { Habit, HabitFrequency } from "@/lib/context/HabitContext";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

// Days of the week for selecting in weekly habits
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface HabitEditModalProps {
    isOpen: boolean;
    habit: Habit | null;
    categories: Array<{ id: string; name: string; color: string }>;
    onSave: (updatedHabit: Partial<Habit>) => void;
    onCancel: () => void;
}

export default function HabitEditModal({
    isOpen,
    habit,
    categories,
    onSave,
    onCancel,
}: HabitEditModalProps) {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [frequency, setFrequency] = useState<HabitFrequency>("Daily");
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [date, setDate] = useState("");
    const [enableReminder, setEnableReminder] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get today's date in YYYY-MM-DD format for date input min attribute
    const today = new Date().toISOString().split("T")[0];

    // Initialize form with habit data when opened
    useEffect(() => {
        if (habit) {
            setTitle(habit.title);
            setCategory(habit.category);
            setFrequency(habit.frequency);
            setSelectedDays(habit.selectedDays || []);
            setDate(habit.date);
            setEnableReminder(habit.enableReminder || false);
        }
    }, [habit]);

    if (!isOpen || !habit) return null;

    // Toggle a day in the selectedDays array
    const toggleDay = (day: string) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) return;

        setIsSubmitting(true);

        const updatedHabit: Partial<Habit> = {
            title,
            category,
            frequency,
            date,
            enableReminder,
        };

        // Only include selectedDays for weekly habits
        if (frequency === "Weekly") {
            updatedHabit.selectedDays = selectedDays;
        }

        onSave(updatedHabit);
        setIsSubmitting(false);
    };

    // Filter out the "All" category which is used for filtering
    const userCategories = categories.filter(cat => cat.id !== "all");

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                    onClick={onCancel}></div>

                <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ">
                    <div className="px-4 pt-5 pb-4 bg-white  sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 ">
                                Edit Habit
                            </h3>
                            <button
                                onClick={onCancel}
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
                                <label
                                    htmlFor="category"
                                    className="block text-sm font-medium text-gray-700  mb-1">
                                    Category
                                </label>
                                <select
                                    id="category"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
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
                                    onChange={e => setFrequency(e.target.value as HabitFrequency)}
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

                            <div className="mb-4">
                                <label
                                    htmlFor="date"
                                    className="block text-sm font-medium text-gray-700  mb-1">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    id="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    min={today}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E50046] focus:border-transparent "
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
                                    className="ml-2 block text-sm text-gray-700 ">
                                    Enable Daily Reminder
                                </label>
                            </div>

                            <div className="flex justify-end mt-6 space-x-3">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ">
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
                                    {isSubmitting ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
