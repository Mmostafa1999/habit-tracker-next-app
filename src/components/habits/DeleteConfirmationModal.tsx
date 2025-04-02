"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  habitTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmationModal({
  isOpen,
  habitTitle,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onCancel}></div>

        <div className="inline-block p-6 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 ">
              Delete Habit
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <p className="mb-4 text-gray-700 ">
            Are you sure you want to delete <strong>{habitTitle}</strong>? This
            action cannot be undone.
          </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 ">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 