"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useHabits } from "@/lib/context/HabitContext";
import { getUserProfileData } from "@/lib/utils/userProfileUtils";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameMonth,
  isToday,
  startOfMonth,
  subMonths,
} from "date-fns";
import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import CategoryManagerModal from "../modals/CategoryManagerModal";

export default function UserProfile({
  onDateSelected,
}: {
  onDateSelected?: (date: Date) => void;
}) {
  const { user } = useAuth();
  const { getCompletionPercentage } = useHabits();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  const progress = getCompletionPercentage();
  const currentMonth = format(currentDate, "MMMM yyyy");

  // Fetch user profile data from Firestore
  useEffect(() => {
    const fetchUserProfile = async () => {
      
      if (!user) return;

      try {
        const profileData = await getUserProfileData(user);

        if (profileData) {
          setProfileImage(profileData.profileImage);
          setDisplayName(profileData.displayName);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();

    // Set up an interval to poll for profile updates when this component is visible
    // This ensures updates made in the ProfileForm are reflected here without a full page refresh
    const intervalId = setInterval(fetchUserProfile, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, [user]);

  // Animate progress when it changes
  useEffect(() => {
    setAnimatedProgress(0);
    const timeout = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 50);
    return () => clearTimeout(timeout);
  }, [progress]);

  // Get initials for avatar
  const getInitials = () => {
    if (displayName) {
      return displayName
        .split(" ")
        .map(name => name[0])
        .join("")
        .toUpperCase();
    }
    return user?.email?.substring(0, 2)?.toUpperCase() || "MD";
  };

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // Generate calendar days for current month
  const getDaysInMonth = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const dateRange = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const startDay = getDay(monthStart);
    const blanks = Array(startDay).fill(null);

    return [...blanks, ...dateRange];
  };

  // Handle date selection
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);

    // Notify parent component about date selection
    if (onDateSelected) {
      onDateSelected(date);
    }
  };

  // Create an array of weekdays for the calendar header
  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
  const calendarDays = getDaysInMonth();

  // Profile image component
  const ProfileImageComponent = () => {
    if (!profileImage) {
      return (
        <div className="h-16 w-16 rounded-full bg-[#E50046] flex items-center justify-center text-white text-xl font-bold">
          {getInitials()}
        </div>
      );
    }

    // Check if the image is a base64 string
    if (profileImage.startsWith("data:image")) {
      return (
        <Image
          loading="lazy"
          src={profileImage}
          alt="Profile"
          width={64}
          height={64}
          className="h-16 w-16 rounded-full object-cover"
        />
      );
    }

    // Otherwise use Next.js Image component for remote URLs
    return (
      <div className="h-16 w-16 rounded-full overflow-hidden">
        <Image
          src={profileImage}
          alt="Profile"
          width={64}
          height={64}
          className="object-cover"
        />
      </div>
    );
  };

  return (
    <div className="w-80 h-screen px-8 pb-20 bg-white  flex flex-col shadow-md z-10 overflow-y-auto">
      {/* User Profile Section */}
      <div className="flex flex-col items-center mb-4">
        <ProfileImageComponent />
        <h2 className="mt-4 font-semibold text-gray-900  text-lg">
          {displayName || user?.email?.split("@")[0] || "User"}
        </h2>
        <p className="text-sm text-gray-500 ">
          {user?.email || ""}
        </p>
      </div>

      {/* Progress Circle */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900  mb-3">
          Today&apos;s Progress
        </h3>
        <div className="flex justify-center">
          <div className="relative h-32 w-28">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e6e6e6"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#E50046"
                strokeWidth="8"
                strokeDasharray={`${animatedProgress * 2.83} ${283 - animatedProgress * 2.83}`}
                strokeDashoffset="0"
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                initial={{ strokeDasharray: "0 283" }}
                animate={{
                  strokeDasharray: `${animatedProgress * 2.83} ${283 - animatedProgress * 2.83}`,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
              {/* Percentage text */}
              <text
                x="50"
                y="50"
                dominantBaseline="middle"
                textAnchor="middle"
                fontSize="24"
                fontWeight="bold"
                fill="currentColor"
                className="text-gray-900 ">
                {progress}%
              </text>
            </svg>
          </div>
        </div>
        <p className="text-center text-sm text-gray-500  mt-2">
          {progress}% of habits completed
        </p>
      </div>

      {/* Calendar Section */}
      <div className="flex flex-col ">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-1 text-gray-600  hover:text-gray-900 ">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <h3 className="font-medium text-gray-900 ">
            {currentMonth}
          </h3>
          <button
            onClick={goToNextMonth}
            className="p-1 text-gray-600  hover:text-gray-900 ">
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {weekdays.map((day, index) => (
            <div
              key={index}
              className="text-xs font-medium text-gray-500 ">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-6">
          {/* Render days */}
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`blank-${index}`} className="h-8 w-8" />;
            }

            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelectedDay =
              day &&
              day.getDate() === selectedDate.getDate() &&
              day.getMonth() === selectedDate.getMonth() &&
              day.getFullYear() === selectedDate.getFullYear();
            const isTodayDate = day && isToday(day);

            return (
              <div
                key={index}
                onClick={() => handleSelectDate(day)}
                className={`h-8 w-8 flex items-center justify-center rounded-full text-sm cursor-pointer 
                                  ${!isCurrentMonth
                    ? "text-gray-400 "
                    : isSelectedDay
                      ? "bg-red-500 text-white font-bold"
                      : isTodayDate
                        ? "bg-gray-200  font-semibold"
                        : "text-gray-700 hover:bg-gray-100 "
                  }`}>
                {day.getDate()}
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </div>
  );
}
