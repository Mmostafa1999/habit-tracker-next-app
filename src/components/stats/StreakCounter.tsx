"use client";

import { FireIcon } from "@heroicons/react/24/solid";

type StreakCounterProps = {
  streak: number;
};

export default function StreakCounter({ streak }: StreakCounterProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex items-center justify-center w-32 h-32 rounded-full bg-[#FFF0BD] border-4 border-[#E50046]">
        <div className="text-center">
          <div className="text-4xl font-bold text-[#E50046]">{streak}</div>
          <div className="text-sm text-gray-700">days</div>
        </div>
      </div>

      <div className="mt-4 flex items-center space-x-2">
        <FireIcon className="h-6 w-6 text-orange-500" />
        <span className="text-lg font-semibold ">
          Current Streak
        </span>
      </div>

      <p className="mt-2 text-sm text-gray-500  text-center">
        {streak > 0
          ? `You've completed your habits for ${streak} consecutive day${streak > 1 ? "s" : ""}!`
          : "Complete your habits today to start a streak!"}
      </p>
    </div>
  );
}
