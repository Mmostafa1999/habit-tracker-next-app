"use client";

import {
  collection,
  DocumentData,
  FirestoreError,
  onSnapshot,
  query,
  QueryConstraint,
  Unsubscribe,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { handleError } from "../utils/errorHandling";

interface UseFirestoreCollectionOptions {
  onError?: (error: FirestoreError) => void;
  onSuccess?: (data: DocumentData[]) => void;
  transform?: (doc: DocumentData) => any;
  skip?: boolean;
  dependencies?: any[];
}

/**
 * Custom hook for real-time Firestore collection data with error handling
 */
export function useFirestoreCollection<T = DocumentData>(
  userId: string | undefined | null,
  collectionPath: string,
  queryConstraints: QueryConstraint[] = [],
  options: UseFirestoreCollectionOptions = {},
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const {
    onError,
    onSuccess,
    transform = doc => ({ id: doc.id, ...doc.data() }),
    skip = false,
    dependencies = [],
  } = options;

  useEffect(() => {
    // Skip if no user or explicitly skipped
    if (!userId || skip) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Create collection reference
    const collectionRef = collection(db, "users", userId, collectionPath);
    const q = query(collectionRef, ...queryConstraints);

    // Set up real-time listener
    let isMounted = true;
    let unsubscribe: Unsubscribe;

    try {
      unsubscribe = onSnapshot(
        q,
        snapshot => {
          if (!isMounted) return;

          const items: T[] = [];
          snapshot.forEach(doc => {
            items.push(transform(doc) as T);
          });

          setData(items);
          setLoading(false);
          onSuccess?.(items);
        },
        (error: FirestoreError) => {
          if (!isMounted) return;

          const errorMessage = `Failed to load ${collectionPath}: ${error.message}`;
          console.error(errorMessage, error);
          setError(errorMessage);
          setLoading(false);

          if (onError) {
            onError(error);
          } else {
            handleError(error, errorMessage);
          }
        },
      );
    } catch (error) {
      if (isMounted) {
        handleError(error, `Error setting up listener for ${collectionPath}`);
        setLoading(false);
        setError(`Failed to initialize ${collectionPath} listener`);
      }
    }

    // Cleanup
    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
    // Fix: Use a stable reference to queryConstraints instead of spreading it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userId,
    collectionPath,
    JSON.stringify(queryConstraints),
    skip,
    ...dependencies,
  ]);

  return { data, loading, error };
}
