/**
 * Firebase category operations
 */
import {
  addDoc,
  collection,
  db,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
} from "../../firebase/config";
import { handleFirebaseError } from "../../utils/firebaseUtils";
import {
  ApiError,
  ServiceResult,
  createErrorResult,
  createSuccessResult,
} from "../common/types";
import { getHabits } from "./habitOperations";
import { Category } from "./habitService";

/**
 * Get all categories for a user
 */
export async function getCategories(
  userId: string,
): Promise<ServiceResult<Category[]>> {
  try {
    const categoriesRef = collection(db, "users", userId, "categories");
    const snapshot = await getDocs(categoriesRef);

    const categories: Category[] = [];
    snapshot.forEach(doc => {
      const categoryData = doc.data() as Omit<Category, "id">;
      categories.push({
        id: doc.id,
        ...categoryData,
      });
    });

    return createSuccessResult(categories);
  } catch (error: unknown) {
    const firebaseError = handleFirebaseError(error);
    return createErrorResult(
      new ApiError(
        firebaseError.message || "Failed to fetch categories",
        firebaseError.code || "categories/unknown",
      ),
    );
  }
}

/**
 * Create a new category
 */
export async function createCategory(
  userId: string,
  category: Omit<Category, "id">,
): Promise<ServiceResult<Category>> {
  try {
    // Prevent creating another "All" category
    if (category.name === "All" || category.name.toLowerCase() === "all") {
      return createErrorResult(
        new ApiError(
          "Cannot create a category named 'All' as it is a system-defined category",
          "categories/protected",
          400,
        ),
      );
    }

    // Check if a category with this name or color already exists
    const categoriesRef = collection(db, "users", userId, "categories");
    const q = query(categoriesRef);
    const existingDocs = await getDocs(q);

    const existingCategoryWithSameName = existingDocs.docs.find(doc => {
      const docData = doc.data();
      return (
        docData.name &&
        category.name &&
        docData.name.toLowerCase() === category.name.toLowerCase()
      );
    });

    if (existingCategoryWithSameName) {
      return createErrorResult(
        new ApiError(
          "A category with this name already exists",
          "categories/duplicate-name",
          400,
        ),
      );
    }

    const existingCategoryWithSameColor = existingDocs.docs.find(
      doc => doc.data().color === category.color,
    );

    if (existingCategoryWithSameColor) {
      return createErrorResult(
        new ApiError(
          "A category with this color already exists",
          "categories/duplicate-color",
          400,
        ),
      );
    }

    // Create the new category
    const docRef = await addDoc(categoriesRef, {
      ...category,
      createdAt: serverTimestamp(),
    });

    return createSuccessResult({
      id: docRef.id,
      ...category,
    });
  } catch (error: unknown) {
    const firebaseError = handleFirebaseError(error);
    return createErrorResult(
      new ApiError(
        firebaseError.message || "Failed to create category",
        firebaseError.code || "categories/unknown",
        400,
      ),
    );
  }
}

/**
 * Update an existing category
 */
export async function updateCategory(
  userId: string,
  categoryId: string,
  updates: Partial<Category>,
): Promise<ServiceResult<Category>> {
  try {
    // Don't allow updating the "All" category
    if (categoryId === "all" || updates.name === "All") {
      return createErrorResult(
        new ApiError(
          "Cannot modify the All category",
          "categories/protected",
          400,
        ),
      );
    }

    const categoryRef = doc(db, "users", userId, "categories", categoryId);
    const categoryDoc = await getDoc(categoryRef);

    if (!categoryDoc.exists()) {
      return createErrorResult(
        new ApiError("Category not found", "categories/not-found", 404),
      );
    }

    // Check for duplicate name or color if name or color is being updated
    if (updates.name || updates.color) {
      const categoriesRef = collection(db, "users", userId, "categories");
      const q = query(categoriesRef);
      const existingDocs = await getDocs(q);

      // Check for duplicate name
      if (updates.name) {
        const existingCategoryWithSameName = existingDocs.docs.find(doc => {
          const docData = doc.data();
          return (
            doc.id !== categoryId &&
            docData.name &&
            updates.name &&
            docData.name.toLowerCase() === updates.name.toLowerCase()
          );
        });

        if (existingCategoryWithSameName) {
          return createErrorResult(
            new ApiError(
              "A category with this name already exists",
              "categories/duplicate-name",
              400,
            ),
          );
        }
      }

      // Check for duplicate color
      if (updates.color) {
        const existingCategoryWithSameColor = existingDocs.docs.find(
          doc => doc.id !== categoryId && doc.data().color === updates.color,
        );

        if (existingCategoryWithSameColor) {
          return createErrorResult(
            new ApiError(
              "A category with this color already exists",
              "categories/duplicate-color",
              400,
            ),
          );
        }
      }
    }

    // Prevent ID field from being updated
    const safeUpdates = { ...updates };
    delete safeUpdates.id;

    await updateDoc(categoryRef, {
      ...safeUpdates,
      updatedAt: serverTimestamp(),
    });

    // Fetch the updated category
    const updatedCategoryDoc = await getDoc(categoryRef);
    const updatedCategory = updatedCategoryDoc.data() as Omit<Category, "id">;

    return createSuccessResult({
      id: categoryId,
      ...updatedCategory,
    });
  } catch (error: unknown) {
    const firebaseError = handleFirebaseError(error);
    return createErrorResult(
      new ApiError(
        firebaseError.message || "Failed to update category",
        firebaseError.code || "categories/unknown",
        400,
      ),
    );
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(
  userId: string,
  categoryId: string,
): Promise<ServiceResult<void>> {
  try {
    // Don't allow deleting the "All" category
    if (categoryId === "all") {
      return createErrorResult(
        new ApiError(
          "Cannot delete the All category",
          "categories/protected",
          400,
        ),
      );
    }

    const categoryRef = doc(db, "users", userId, "categories", categoryId);
    const categoryDoc = await getDoc(categoryRef);

    if (!categoryDoc.exists()) {
      return createErrorResult(
        new ApiError("Category not found", "categories/not-found", 404),
      );
    }

    const categoryData = categoryDoc.data() as Category;

    // Get all habits that use this category
    const habitsResult = await getHabits(userId);
    if (habitsResult.result === "ERROR" || !habitsResult.data) {
      return createErrorResult(
        habitsResult.error ||
          new ApiError("Failed to fetch habits", "habits/unknown"),
      );
    }

    const habitsWithCategory = habitsResult.data.filter(
      habit => habit.category === categoryData.name,
    );

    // Delete all habits associated with this category
    for (const habit of habitsWithCategory) {
      await deleteDoc(doc(db, "users", userId, "habits", habit.id));
    }

    // Delete the category
    await deleteDoc(categoryRef);

    return createSuccessResult(undefined);
  } catch (error: unknown) {
    const firebaseError = handleFirebaseError(error);
    return createErrorResult(
      new ApiError(
        firebaseError.message || "Failed to delete category",
        firebaseError.code || "categories/unknown",
      ),
    );
  }
}
