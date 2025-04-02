"use client";

import { useHabits } from "@/lib/context/HabitContext";

export default function CategoryFilters() {
  const { selectedCategory, setSelectedCategory, categories } = useHabits();

  return (
    <div className="flex space-x-2 mt-4">
      {categories.map(category => (
        <button
          key={category.id}
          onClick={() => setSelectedCategory(category.name)}
          className={`px-4 py-2 rounded-md flex items-center text-sm font-medium transition-colors ${selectedCategory === category.name
            ? `${category.color} text-white bg-[#E50046]`
            : "  text-gray-700  border border-gray-200  hover:bg-gray-50 "
            }`}>
          <span
            className={`inline-block h-2 w-2 rounded-full mr-2 ${category.color}`}></span>
          {category.name}
          
        </button>
      ))}
    </div>
  );
}
