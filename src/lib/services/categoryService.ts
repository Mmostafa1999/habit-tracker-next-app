'use client';

import { 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  collection,
  getDocs,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Category } from '../types';
import { handleError, showSuccess } from '../utils/errorHandling';
import {  batchAddDocuments } from '../utils/firebaseHelpers';

// Default categories used when creating a new user
export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Health', color: 'bg-orange-500' },
  { name: 'Work', color: 'bg-green-500' },
  { name: 'Personal', color: 'bg-blue-500' }
];

// System category that's always available
export const SYSTEM_ALL_CATEGORY: Category = { 
  id: 'system-all', 
  name: 'All', 
  color: 'bg-[#E50046]' 
};

/**
 * Create default categories for a new user
 */
export const createDefaultCategories = async (userId: string): Promise<boolean> => {
  return batchAddDocuments({
    userId,
    collectionName: 'categories',
    documents: DEFAULT_CATEGORIES
  });
};

/**
 * Add a new category
 */
export const addCategory = async (
  userId: string,
  name: string,
  color: string
): Promise<string | null> => {
  try {
    // Check if category with same name already exists (case insensitive)
    const categoriesRef = collection(db, 'users', userId, 'categories');
    const q = query(
      categoriesRef,
      where('name', '==', name)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      handleError(null, `A category named "${name}" already exists`);
      return null;
    }
    
    // Add new category
    const newCategory = {
      name,
      color,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(categoriesRef, newCategory);
    showSuccess('Category created successfully');
    return docRef.id;
  } catch (error) {
    handleError(error, 'Failed to create category');
    return null;
  }
};

/**
 * Update an existing category
 */
export const updateCategory = async (
  userId: string,
  id: string,
  name: string
): Promise<boolean> => {
  try {
    // Prevent updating system category
    if (id === SYSTEM_ALL_CATEGORY.id) {
      handleError(null, 'Cannot modify system category');
      return false;
    }
    
    // Check if another category with same name already exists
    const categoriesRef = collection(db, 'users', userId, 'categories');
    const q = query(
      categoriesRef,
      where('name', '==', name)
    );
    const querySnapshot = await getDocs(q);
    
    // If we found a category with the same name that's not the one we're updating
    if (!querySnapshot.empty && querySnapshot.docs[0].id !== id) {
      handleError(null, `A category named "${name}" already exists`);
      return false;
    }
    
    // Update the category
    const categoryRef = doc(db, 'users', userId, 'categories', id);
    await updateDoc(categoryRef, {
      name,
      updatedAt: serverTimestamp()
    });
    
    showSuccess('Category updated successfully');
    return true;
  } catch (error) {
    handleError(error, 'Failed to update category');
    return false;
  }
};

/**
 * Delete a category and reassign associated habits
 */
export const deleteCategory = async (
  userId: string,
  id: string
): Promise<boolean> => {
  try {
    // Prevent deleting system category
    if (id === SYSTEM_ALL_CATEGORY.id) {
      handleError(null, 'Cannot delete system category');
      return false;
    }
    
    // First get the category to delete
    const categoryRef = doc(db, 'users', userId, 'categories', id);
    
    // Find habits with this category
    const habitsRef = collection(db, 'users', userId, 'habits');
    const q = query(habitsRef, where('category', '==', id));
    const habitSnapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    
    // Update all habits with this category to use "Uncategorized"
    habitSnapshot.forEach((habitDoc) => {
      batch.update(habitDoc.ref, {
        category: 'uncategorized',
        updatedAt: serverTimestamp()
      });
    });
    
    // Delete the category
    batch.delete(categoryRef);
    
    // Commit all changes
    await batch.commit();
    showSuccess('Category deleted successfully');
    return true;
  } catch (error) {
    handleError(error, 'Failed to delete category');
    return false;
  }
}; 