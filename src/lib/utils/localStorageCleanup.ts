/**
 * Utility for Firebase localStorage and IndexedDB cleanup
 * This helps protect authentication tokens from XSS attacks
 */

/**
 * Cleans up Firebase-related data from localStorage and IndexedDB
 * @param skipAuthKeys - Whether to skip authentication-related keys (useful during auth flows)
 */
export const cleanFirebaseLocalStorage = (skipAuthKeys = false): void => {
  if (typeof window === "undefined") return;

  try {
    const keysToRemove: string[] = [];

    // Find all Firebase-related keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("firebase:") ||
          key.startsWith("firebaseLocalStorageDb") ||
          key.includes("firebase") ||
          key.includes("firestore") ||
          key.includes("auth"))
      ) {
        // Skip keys needed for Google auth redirects when needed
        if (
          skipAuthKeys &&
          (key.includes("pendingRedirect") ||
            key.includes("redirectEvent") ||
            key.includes("authEvent"))
        ) {
          continue;
        }

        keysToRemove.push(key);
      }
    }

    // Remove all identified keys
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`Failed to remove item from localStorage: ${key}`, e);
      }
    });

    // Clear Firebase-related IndexedDB databases if possible
    // But skip this during auth processes
    const isAuthRedirect = document.referrer.includes("accounts.google.com");
    if (!isAuthRedirect && !skipAuthKeys) {
      const idbDatabases = [
        "firebaseLocalStorageDb",
        "firebase-heartbeat-database",
        "firebase-installations-database",
      ];

      idbDatabases.forEach(dbName => {
        try {
          indexedDB.deleteDatabase(dbName);
        } catch (e) {
          console.warn(`Failed to delete IndexedDB database: ${dbName}`, e);
        }
      });
    }
  } catch (e) {
    console.error("Error cleaning Firebase localStorage data:", e);
  }
};

/**
 * Self-executing function to clean storage immediately when imported
 * This should be imported before any Firebase code runs
 */
export const initializeStorageCleanup = (): void => {
  cleanFirebaseLocalStorage(true); // Skip auth keys on initial cleanup
};

// For backwards compatibility with existing import in client-layout.tsx
if (typeof window !== "undefined") {
  initializeStorageCleanup();
}
