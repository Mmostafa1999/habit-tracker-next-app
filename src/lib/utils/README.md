# Utility Functions

This directory contains utility functions used throughout the application.

## File Organization

### Core Utility Files

- **achievementUtils.ts**: Achievement-related utilities including progress calculation, initialization, and processing
- **dateUtils.ts**: Date manipulation functions for formatting, comparison, and time range calculations
- **errorHandling.ts**: Standardized error handling with user-friendly messages
- **firebaseHelpers.ts**: Common Firebase operations for working with Firestore
- **habitUtils.ts**: Habit-specific utilities for occurrence generation and tracking
- **statisticsUtils.ts**: Functions for calculating user statistics and metrics
- **typeAdapters.ts**: Type conversion utilities between service and UI layers
- **userProfileUtils.ts**: User profile related helper functions
- **data-fetching.ts**: Centralized data fetching utilities with caching

## Usage Guidelines

1. **Keep utility functions pure**: Utility functions should be pure, meaning they don't have side effects and return the same output for the same input.

2. **Maintain type safety**: All utility functions should be properly typed with TypeScript.

3. **Use consistent error handling**: Use the `errorHandling.ts` utilities for consistent error messages and reporting.

4. **Avoid circular dependencies**: Don't create circular dependencies between utility files.

5. **Document your code**: Each utility function should have a JSDoc comment explaining its purpose, parameters, and return value.

6. **Test coverage**: Utility functions should have high test coverage due to their reusability.

## Migration Note

Previously, the application had utility functions split between `src/lib/utils` and `src/utils`. These have now been consolidated into a single `src/lib/utils` directory to avoid duplication and ensure consistency across the application.
