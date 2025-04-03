/**
 * Utility function to clean up Firebase-related data from localStorage
 * This helps protect authentication tokens from XSS attacks
 */
export const cleanFirebaseLocalStorage = (): void => {
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
        // Skip keys needed for Google auth redirects
        if (
          key.includes("pendingRedirect") ||
          key.includes("redirectEvent") ||
          key.includes("authEvent")
        ) {
          console.log(`Preserving Google auth key: ${key}`);
          continue;
        }

        keysToRemove.push(key);
        console.log(
          `Found Firebase-related localStorage key to remove: ${key}`,
        );
      }
    }

    // Remove all identified keys
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`Removed localStorage key: ${key}`);
      } catch (e) {
        console.warn(`Failed to remove item from localStorage: ${key}`, e);
      }
    });

    // For debugging: Log all keys that still exist after cleanup
    console.log("Remaining localStorage keys after cleanup:");
    for (let i = 0; i < localStorage.length; i++) {
      console.log(`- ${localStorage.key(i)}`);
    }

    // Clear Firebase-related IndexedDB databases if possible
    // But skip this during auth processes
    const isAuthRedirect = document.referrer.includes("accounts.google.com");
    if (!isAuthRedirect) {
      const idbDatabases = [
        "firebaseLocalStorageDb",
        "firebase-heartbeat-database",
        "firebase-installations-database",
      ];

      idbDatabases.forEach(dbName => {
        try {
          indexedDB.deleteDatabase(dbName);
          console.log(`Deleted IndexedDB database: ${dbName}`);
        } catch (e) {
          console.warn(`Failed to delete IndexedDB database: ${dbName}`, e);
        }
      });
    } else {
      console.log("Skipping IndexedDB cleanup due to ongoing auth redirect");
    }
  } catch (e) {
    console.error("Error cleaning Firebase localStorage data:", e);
  }
};
