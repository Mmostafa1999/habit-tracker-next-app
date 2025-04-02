/**
 * Common Firebase operations used across multiple context providers
 */

import {
  DocumentData,
  DocumentReference,
  Timestamp,
  collection,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { handleError } from "./errorHandling";

/**
 * Add multiple documents to Firestore in a batch operation
 */
export async function batchAddDocuments<T extends DocumentData>({
  userId,
  collectionName,
  documents,
  idField = "id",
}: {
  userId: string;
  collectionName: string;
  documents: T[];
  idField?: keyof T;
}): Promise<boolean> {
  try {
    const collectionRef = collection(db, "users", userId, collectionName);
    const batch = writeBatch(db);

    documents.forEach(document => {
      // If document has an id field, use it as the document ID
      const docId = document[idField]?.toString();
      const docRef = docId
        ? doc(db, "users", userId, collectionName, docId)
        : doc(collectionRef);

      batch.set(docRef, {
        ...document,
        // Add a createdAt timestamp if it doesn't exist
        createdAt: document.createdAt || Timestamp.now(),
      });
    });

    await batch.commit();
    return true;
  } catch (error) {
    handleError(error, `Failed to add ${collectionName}`);
    return false;
  }
}

/**
 * Create a document reference with a specific ID in a subcollection
 */
export function createDocRef(
  userId: string,
  collectionName: string,
  docId: string,
): DocumentReference {
  return doc(db, "users", userId, collectionName, docId);
}

/**
 * Create a collection reference in a user's subcollection
 */
export function createCollectionRef(userId: string, collectionName: string) {
  return collection(db, "users", userId, collectionName);
}

/**
 * Convert a Firestore timestamp to an ISO date string
 */
export function timestampToISOString(
  timestamp: Timestamp | null | undefined,
): string {
  if (!timestamp) {
    return new Date().toISOString();
  }
  return timestamp.toDate().toISOString();
}

/**
 * Generate a server timestamp for use in document creation
 */
export function getServerTimestamp() {
  return Timestamp.now();
}
