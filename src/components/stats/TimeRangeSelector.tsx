"use client";

import { TimeRange } from "@/lib/utils/statisticsUtils";

type TimeRangeSelectorProps = {
  selectedRange: TimeRange;
  onChange: (range: TimeRange) => void;
};

export default function TimeRangeSelector({
  selectedRange,
  onChange,
}: TimeRangeSelectorProps) {
  const timeRanges: { label: string; value: TimeRange }[] = [
    { label: "Last 7 days", value: "7days" },
    { label: "Last 30 days", value: "30days" },
    { label: "Last 90 days", value: "90days" },
    { label: "All time", value: "all" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {timeRanges.map(range => (
        <button
          key={range.value}
          className={`px-4 py-2 rounded-full text-sm font-medium 
            ${
              selectedRange === range.value
                ? "bg-[#E50046] text-white"
                : "bg-gray-100  text-gray-800 hover:bg-gray-200 "
            }`}
          onClick={() => onChange(range.value)}>
          {range.label}
        </button>
      ))}
    </div>
  );
}
