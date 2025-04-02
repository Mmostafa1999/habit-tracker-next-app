"use client";

import { Category, useHabits } from "@/lib/context/HabitContext";
import {
  ExclamationTriangleIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import toast from "react-hot-toast";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/context/AuthContext";
import { getHabitService } from "@/lib/services/serviceFactory";

type CategoryManagerModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type DeleteConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  categoryName: string;
};

// Color options for categories
const colorOptions = [
  { name: "Red", value: "bg-red-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Yellow", value: "bg-yellow-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Indigo", value: "bg-indigo-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Pink", value: "bg-pink-500" },
];

function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  categoryName,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          aria-hidden="true"
          onClick={onClose}></div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ">
          <div className="px-4 pt-5 pb-4 bg-white  sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-red-100 rounded-full sm:mx-0 sm:h-10 sm:w-10 ">
                <ExclamationTriangleIcon
                  className="w-6 h-6 text-red-600 "
                  aria-hidden="true"
                />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg font-medium leading-6 text-gray-900 ">
                  Delete Category
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 ">
                    Are you sure you want to delete{" "}
                    <span className="font-bold">{categoryName}</span>? This
                    action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 py-3 bg-gray-50  sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm "
              onClick={onConfirm}>
              Confirm Delete
            </button>
            <button
              type="button"
              className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CategoryManagerModal({
  isOpen,
  onClose,
}: CategoryManagerModalProps) {
  const { categories, addCategory, updateCategory, deleteCategory } =
    useHabits();
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingCategoryColor, setEditingCategoryColor] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("bg-blue-500");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );
  const { user } = useAuth();

  // Filter out the system categories (both "all" and "system-all" IDs)
  const editableCategories = categories.filter(
    cat => cat.id !== 'all' && cat.id !== 'system-all' && cat.name !== 'All'
  );

  // Display system categories separately
  const systemCategories = categories.filter(
    cat => cat.id === 'all' || cat.id === 'system-all' || cat.name === 'All'
  );

  const handleStartEditing = (category: Category) => {
    // Don't allow editing system categories
    if (category.id === 'all' || category.id === 'system-all' || category.name === 'All') {
      toast.error("The 'All' category cannot be modified as it is a system-defined category.");
      return;
    }

    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
    setEditingCategoryColor(category.color);
  };

  const handleCancelEditing = () => {
    setEditingCategoryId(null);
    setEditingCategoryName("");
    setEditingCategoryColor("");
  };

  const handleSaveEdit = async (id: string) => {
    // Additional safeguard against editing system categories
    if (id === 'all' || id === 'system-all') {
      toast.error("The 'All' category cannot be modified.");
      setEditingCategoryId(null);
      return;
    }

    // Ensure the category we're editing still exists
    const categoryExists = categories.some(cat => cat.id === id);
    if (!categoryExists) {
      toast.error("Category no longer exists");
      setEditingCategoryId(null);
      return;
    }

    if (!editingCategoryName.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    // Prevent renaming to "All"
    if (editingCategoryName.trim().toLowerCase() === 'all') {
      toast.error("Cannot rename a category to 'All' as it is a system-defined category.");
      return;
    }

    try {
      const categoryToUpdate = categories.find(cat => cat.id === id);
      if (categoryToUpdate) {
        // Create a Firestore document reference
        const categoryRef = doc(db, 'users', user.uid, 'categories', id);

        // Update both name and color in one update operation
        await updateDoc(categoryRef, {
          name: editingCategoryName,
          color: editingCategoryColor,
          updatedAt: serverTimestamp()
        });

        // Call context update method for the name (which will refresh from Firestore)
        await updateCategory(id, editingCategoryName);

        setEditingCategoryId(null);
        toast.success("Category updated successfully");
      }
    } catch (error) {
      toast.error("Failed to update category");
      console.error("Error updating category:", error);
    }
  };

  const handleDeleteClick = (category: Category) => {
    // Don't allow deleting system categories
    if (category.id === 'all' || category.id === 'system-all' || category.name === 'All') {
      toast.error("The 'All' category cannot be deleted as it is a system-defined category.");
      return;
    }

    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    // Additional safeguard against deleting system categories
    if (categoryToDelete.id === 'all' || categoryToDelete.id === 'system-all' || categoryToDelete.name === 'All') {
      toast.error("The 'All' category cannot be deleted.");
      setIsDeleteModalOpen(false);
      return;
    }

    try {
      // Use the categoryId for deletion
      await deleteCategory(categoryToDelete.id);
      toast.success("Category deleted successfully");
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      toast.error("Failed to delete category");
      console.error("Error deleting category:", error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    // Prevent creating a category named "All"
    if (newCategoryName.trim().toLowerCase() === 'all') {
      toast.error("Cannot create a category named 'All' as it is a system-defined category.");
      return;
    }

    try {
      // Use the context function which now returns the result
      const result = await addCategory(newCategoryName, newCategoryColor);
      
      // Check if there was an error
      if (result && result.result === 'ERROR') {
        if (result.error.code === 'categories/duplicate-name') {
          toast.error("A category with this name already exists");
          return;
        } else if (result.error.code === 'categories/duplicate-color') {
          toast.error("A category with this color already exists");
          return;
        } else {
          toast.error(result.error.message || "Failed to add category");
          return;
        }
      }

      // If successful (no error caught and returned above)
      setNewCategoryName("");
      setNewCategoryColor("bg-blue-500");
      setIsAddingNew(false);
      toast.success("Category added successfully");
    } catch (error) {
      // Handle any uncaught errors from the service or context
      const errorMessage = error instanceof Error ? error.message : "Failed to add category";
      toast.error(errorMessage);
      console.error("Error adding category:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          aria-hidden="true"
          onClick={onClose}></div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ">
          <div className="px-4 pt-5 pb-4 bg-white  sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium leading-6 text-gray-900 ">
                Categories
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                aria-label="Close">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="border border-gray-200  rounded-lg p-4 mb-6">
              {/* System Categories Section */}
              {systemCategories.map(category => (
                <div
                  key={category.id}
                  className="flex items-center justify-between py-3 border-b border-gray-200 ">
                  <div className="flex items-center">
                    <span
                      className={`inline-block h-4 w-4 rounded-full mr-3 ${category.color}`}></span>
                    <span className="text-gray-800  font-medium flex items-center">
                      {category.name}
                      <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded ">
                        System
                      </span>
                    </span>
                  </div>
                </div>
              ))}

              {/* User Categories Section */}
              {editableCategories.map(category => (
                <div
                  key={category.id}
                  className="flex items-center justify-between py-3 border-b border-gray-200  last:border-b-0">
                  {editingCategoryId === category.id ? (
                    <div className="flex-1 flex items-center">
                      <div className="flex items-center space-x-2 mr-3">
                        <span
                          className={`inline-block h-4 w-4 rounded-full ${editingCategoryColor}`}></span>
                        <div className="relative">
                          <button
                            type="button"
                            className="p-1 border border-gray-300 rounded-md "
                            onClick={() =>
                              document
                                .getElementById(`color-dropdown-${category.id}`)
                                ?.classList.toggle("hidden")
                            }>
                            <span className="sr-only">Change color</span>
                            <PencilIcon className="h-3 w-3 text-gray-500" />
                          </button>

                          <div
                            id={`color-dropdown-${category.id}`}
                            className="absolute z-10 hidden mt-1 border border-gray-200 rounded-md bg-white p-2 w-40 shadow-lg">
                            <div className="grid grid-cols-4 gap-2">
                              {colorOptions.map(color => (
                                <button
                                  key={color.value}
                                  type="button"
                                  className={`h-6 w-6 rounded-full ${color.value} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500`}
                                  title={color.name}
                                  onClick={() => {
                                    setEditingCategoryColor(color.value);
                                    document
                                      .getElementById(
                                        `color-dropdown-${category.id}`,
                                      )
                                      ?.classList.add("hidden");
                                  }}></button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={editingCategoryName}
                        onChange={e => setEditingCategoryName(e.target.value)}
                        className="flex-1 p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E50046] focus:border-transparent "
                        autoFocus
                      />
                      <div className="flex items-center ml-2">
                        <button
                          onClick={() => handleSaveEdit(category.id)}
                          className="p-1 text-green-600 hover:text-green-700 focus:outline-none"
                          aria-label="Save">
                          ✓
                        </button>
                        <button
                          onClick={handleCancelEditing}
                          className="p-1 text-red-600 hover:text-red-700 focus:outline-none ml-1"
                          aria-label="Cancel">
                          ✗
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center">
                        <span
                          className={`inline-block h-4 w-4 rounded-full mr-3 ${category.color}`}></span>
                        <span className="text-gray-800  font-medium">
                          {category.name}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => handleStartEditing(category)}
                          className="p-1 text-gray-500 hover:text-gray-700  focus:outline-none"
                          aria-label="Edit">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(category)}
                          className="p-1 text-gray-500 hover:text-gray-700  focus:outline-none ml-2"
                          aria-label="Delete">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {isAddingNew && (
                <div className="flex items-center justify-between py-3 mt-2">
                  <div className="flex-1 flex items-center">
                    <div className="flex items-center space-x-2 mr-3">
                      <span
                        className={`inline-block h-4 w-4 rounded-full ${newCategoryColor}`}></span>
                      <div className="relative">
                        <button
                          type="button"
                          className="p-1 border border-gray-300 rounded-md "
                          onClick={() =>
                            document
                              .getElementById("new-color-dropdown")
                              ?.classList.toggle("hidden")
                          }>
                          <span className="sr-only">Change color</span>
                          <PencilIcon className="h-3 w-3 text-gray-500" />
                        </button>

                        <div
                          id="new-color-dropdown"
                          className="absolute z-10 hidden mt-1 border border-gray-200 rounded-md bg-white  p-2 w-40 shadow-lg">
                          <div className="grid grid-cols-4 gap-2">
                            {colorOptions.map(color => (
                              <button
                                key={color.value}
                                type="button"
                                className={`h-6 w-6 rounded-full ${color.value} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500`}
                                title={color.name}
                                onClick={() => {
                                  setNewCategoryColor(color.value);
                                  document
                                    .getElementById("new-color-dropdown")
                                    ?.classList.add("hidden");
                                }}></button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      placeholder="New category name"
                      className="flex-1 p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E50046] focus:border-transparent"
                      autoFocus
                    />
                    <div className="flex items-center ml-2">
                      <button
                        onClick={handleAddCategory}
                        className="p-1 text-green-600 hover:text-green-700 focus:outline-none"
                        aria-label="Save">
                        ✓
                      </button>
                      <button
                        onClick={() => setIsAddingNew(false)}
                        className="p-1 text-red-600 hover:text-red-700 focus:outline-none ml-1"
                        aria-label="Cancel">
                        ✗
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!isAddingNew && (
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="mt-4 flex items-center text-[#E50046] hover:text-[#D00040] font-medium focus:outline-none">
                  <PlusIcon className="w-5 h-5 mr-1" />
                  Add Category
                </button>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-[#E50046] border border-transparent rounded-md hover:bg-[#D00040] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E50046]">
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {categoryToDelete && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          categoryName={categoryToDelete.name}
        />
      )}
    </div>
  );
}
