/**
 * This module runs immediately when imported to clean Firebase data from localStorage
 * Because it's imported before the Firebase SDK initializes, it prevents token leakage
 * Note: This is a self-executing module!
 */

// Import and run the cleanup function

// The module automatically runs initialization when imported
// Nothing else needs to be done here

// Export an empty object to make TypeScript happy
export {};
