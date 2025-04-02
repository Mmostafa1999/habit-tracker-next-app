"use client";

import { createFirebaseFetcher } from "./data-fetching";
import {
  collection,
  db,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "./firebase";

// Cached version of getDocs
export const getCachedCollection = createFirebaseFetcher(
  async collectionPath => {
    const collectionRef = collection(db, collectionPath);
    const querySnapshot = await getDocs(collectionRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  },
);

// Cached version of getDoc
export const getCachedDocument = createFirebaseFetcher(
  async (collectionPath, docId) => {
    const docRef = doc(db, collectionPath, docId);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      return {
        id: docSnapshot.id,
        ...docSnapshot.data(),
      };
    }

    return null;
  },
);

// Cached version of query
export const getCachedQuery = createFirebaseFetcher(
  async (
    collectionPath,
    queryConstraints,
    orderByField = null,
    orderDirection = "asc",
    queryLimit = null,
  ) => {
    const queryRef = collection(db, collectionPath);

    // Build the query
    const constraints = [];

    // Add where clauses
    if (queryConstraints) {
      for (const constraint of queryConstraints) {
        constraints.push(
          where(constraint.field, constraint.operator, constraint.value),
        );
      }
    }

    // Add orderBy
    if (orderByField) {
      constraints.push(orderBy(orderByField, orderDirection));
    }

    // Add limit
    if (queryLimit) {
      constraints.push(limit(queryLimit));
    }

    // Execute query with all constraints
    const querySnapshot = await getDocs(query(queryRef, ...constraints));

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  },
);
