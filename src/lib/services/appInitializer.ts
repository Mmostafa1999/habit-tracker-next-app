/**
 * Application Initializer
 *
 * This module handles the initialization of the application and all its services.
 * It should be imported and called at app startup.
 */
import { initializeServices } from "./serviceFactory";

// Tracks whether initialization has been performed
let initialized = false;

/**
 * Initialize the application and all services
 * This should be called at app startup, typically in the root layout or app component
 */
export async function initializeApp(): Promise<void> {
  if (initialized) {
    return;
  }


  try {
    // Initialize all services
    await initializeServices();

    // Mark as initialized
    initialized = true;

  } catch (error) {
    throw error;
  }
}

/**
 * Check if the application has been initialized
 */
export function isInitialized(): boolean {
  return initialized;
}

/**
 * Reset the initialization state (mainly for testing)
 */
export function resetInitialization(): void {
  initialized = false;
}
