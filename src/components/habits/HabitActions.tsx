"use client";

import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

interface HabitActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export default function HabitActions({
  onEdit,
  onDelete,
}: HabitActionsProps) {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onEdit}
        className="p-2 text-gray-500 hover:text-[#E50046] transition-colors"
        aria-label="Edit habit">
        <PencilIcon className="h-5 w-5" />
      </button>
      <button
        onClick={onDelete}
        className="p-2 text-gray-500 hover:text-red-600 transition-colors"
        aria-label="Delete habit">
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );
} 