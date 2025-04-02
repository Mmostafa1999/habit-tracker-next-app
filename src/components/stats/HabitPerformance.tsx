"use client";

import { Habit } from "@/lib/context/HabitContext";
import { ExclamationTriangleIcon, TrophyIcon } from "@heroicons/react/24/solid";

type HabitPerformanceProps = {
  best: { habit: Habit; completionRate: number }[];
  worst: { habit: Habit; completionRate: number }[];
};

export default function HabitPerformance({
  best,
  worst,
}: HabitPerformanceProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Best Performing Habits */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center mb-4">
          <TrophyIcon className="h-6 w-6 text-yellow-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 ">
            Best Performing
          </h3>
        </div>

        {best.length > 0 ? (
          <ul className="space-y-3">
            {best.map((item, index) => (
              <li
                key={index}
                className="flex justify-between items-center border-b border-gray-100  pb-2">
                <span className="text-gray-800 ">
                  {item.habit.title}
                </span>
                <div className="flex items-center">
                  <div className="w-12 h-5 bg-gray-200  rounded-full mr-2">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${item.completionRate}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-600 ">
                    {item.completionRate}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500  text-center py-4">
            No habit data available
          </p>
        )}
      </div>

      {/* Worst Performing Habits */}
      <div className="bg-white  rounded-lg shadow-md p-4">
        <div className="flex items-center mb-4">
          <ExclamationTriangleIcon className="h-6 w-6 text-orange-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 ">
            Needs Improvement
          </h3>
        </div>

        {worst.length > 0 ? (
          <ul className="space-y-3">
            {worst.map((item, index) => (
              <li
                key={index}
                className="flex justify-between items-center border-b border-gray-100  pb-2">
                <span className="text-gray-800 ">
                  {item.habit.title}
                </span>
                <div className="flex items-center">
                  <div className="w-12 h-5 bg-gray-200  rounded-full mr-2">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${item.completionRate}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-600 ">
                    {item.completionRate}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500  text-center py-4">
            No habit data available
          </p>
        )}
      </div>
    </div>
  );
}
