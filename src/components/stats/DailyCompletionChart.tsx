"use client";

import { DateCompletionData } from "@/lib/utils/statisticsUtils";
import { format, parseISO } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DailyCompletionChartProps = {
  data: DateCompletionData[];
};

export default function DailyCompletionChart({
  data,
}: DailyCompletionChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 ">
          No completion data available
        </p>
      </div>
    );
  }

  // Format the date for display in the chart tooltip
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "MMM dd, yyyy");
    } catch {
      return dateStr;
    }
  };

  // Format the date for X-axis labels
  const formatXAxis = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "MM/dd");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={value => `${value}%`}
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={value => [`${value}%`, "Completion Rate"]}
            labelFormatter={value => formatDate(value as string)}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="#E50046"
            strokeWidth={2}
            dot={{ r: 3, fill: "#E50046" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
