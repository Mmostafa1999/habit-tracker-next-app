"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type CompletionRateChartProps = {
  completionRate: number;
};

export default function CompletionRateChart({
  completionRate,
}: CompletionRateChartProps) {
  // Data for pie chart
  const data = [
    { name: "Completed", value: completionRate },
    { name: "Remaining", value: 100 - completionRate },
  ];

  // Colors
  const COLORS = ["#E50046", "#e5e7eb"];

  return (
    <div className="flex flex-col items-center">
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value">
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={value => [`${value}%`, "Completion Rate"]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center mt-4">
        <div className="text-4xl font-bold text-[#E50046]">
          {completionRate}%
        </div>
        <div className="text-gray-500  mt-1">
          Habit Completion Rate
        </div>
      </div>
    </div>
  );
}
