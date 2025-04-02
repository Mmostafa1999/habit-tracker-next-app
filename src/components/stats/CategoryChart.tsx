"use client";

import { CategoryStat } from "@/lib/utils/statisticsUtils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CategoryChartProps = {
  categories: CategoryStat[];
};

export default function CategoryChart({ categories }: CategoryChartProps) {
  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 ">
          No category data available
        </p>
      </div>
    );
  }

  // Use actual colors from the category data
  const getColor = (category: CategoryStat) => {
    // Handle known color classes
    const colorMap: Record<string, string> = {
      "orange-500": "#f97316",
      "green-500": "#22c55e",
      "blue-500": "#3b82f6",
      "[#E50046]": "#E50046",
    };

    return colorMap[category.color] || "#6366f1"; // Default to indigo if color not found
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={categories}
          margin={{ top: 5, right: 20, left: 5, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tickFormatter={value => `${value}%`}
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={value => [`${value}%`, "Completion Rate"]}
            labelFormatter={value => `Category: ${value}`}
          />
          <Bar
            dataKey="completionRate"
            name="Completion Rate"
            radius={[4, 4, 0, 0]}>
            {categories.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
