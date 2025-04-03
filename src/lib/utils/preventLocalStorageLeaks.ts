/**
 * This module runs immediately when imported to clean Firebase data from localStorage
 * Because it's imported before the Firebase SDK initializes, it prevents token leakage
 * Note: This is a self-executing module!
 */

// Immediately-invoked function to clean up storage
(function cleanupStorage() {
  if (typeof window === "undefined") return;

  try {
    console.log("Cleaning up Firebase localStorage data on module load...");

    // Clear all Firebase-related localStorage items
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
        keysToRemove.push(key);
      }
    }

    // Remove all identified keys
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`Preventing localStorage leak: Removed ${key}`);
      } catch (e) {
        console.warn(`Failed to remove item from localStorage: ${key}`, e);
      }
    });

    // No longer override localStorage methods as that can interfere with auth
    // Just clean up sensitive data instead
  } catch (e) {
    console.error("Error during Firebase localStorage cleanup:", e);
  }
})();

// Export an empty object to make TypeScript happy
export {};
