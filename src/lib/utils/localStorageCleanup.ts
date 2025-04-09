/**
 * Centralized localStorage cleanup utilities for Firebase-related data
 * Helps protect authentication tokens from XSS attacks
 */

/**
 * Cleans up Firebase-related data from localStorage
 * @param {boolean} preserveAuthKeys - Whether to preserve keys needed for auth redirects
 */
export const cleanFirebaseLocalStorage = (preserveAuthKeys = false): void => {
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
        // Skip keys needed for Google auth redirects if preserveAuthKeys is true
        if (
          preserveAuthKeys &&
          (key.includes("pendingRedirect") ||
            key.includes("redirectEvent") ||
            key.includes("authEvent"))
        ) {
          console.log(`Preserving Google auth key: ${key}`);
          continue;
        }

        keysToRemove.push(key);
      }
    }

    // Remove all identified keys
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        if (process.env.NODE_ENV !== "production") {
          console.log(`Removed localStorage key: ${key}`);
        }
      } catch (e) {
        console.warn(`Failed to remove item from localStorage: ${key}`, e);
      }
    });

    // Clear Firebase-related IndexedDB databases if possible and not during auth
    const isAuthRedirect =
      preserveAuthKeys ||
      (typeof document !== "undefined" &&
        document.referrer.includes("accounts.google.com"));

    if (!isAuthRedirect) {
      const idbDatabases = [
        "firebaseLocalStorageDb",
        "firebase-heartbeat-database",
        "firebase-installations-database",
      ];

      idbDatabases.forEach(dbName => {
        try {
          indexedDB.deleteDatabase(dbName);
          if (process.env.NODE_ENV !== "production") {
            console.log(`Deleted IndexedDB database: ${dbName}`);
          }
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
 * Immediately invoked function that runs on module import
 * Can be imported early in the application to clean up before Firebase initializes
 */
export const initializeCleanup = (): void => {
  cleanFirebaseLocalStorage(false);
};

// Auto-initialize when imported in non-SSR contexts
if (typeof window !== "undefined") {
  initializeCleanup();
}
