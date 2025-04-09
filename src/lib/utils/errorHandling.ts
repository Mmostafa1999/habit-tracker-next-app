/**
 * Standardized error handling utilities for the application
 */

import toast from "react-hot-toast";
import {
  ApiError,
  ServiceResult,
  createErrorResult,
  createSuccessResult,
} from "../services/common/types";

// Error type definitions for better type checking
export type FirebaseError = {
  code: string;
  message: string;
};

export type AppError = Error | FirebaseError | ApiError | string | unknown;

/**
 * Extracts a user-friendly error message from various error types
 */
export function getErrorMessage(error: AppError): string {
  if (typeof error === "string") return error;

  if (error instanceof Error) return error.message;

  if (typeof error === "object" && error !== null && "code" in error) {
    const errorCode = (error as { code: string }).code;

    // Firebase Auth errors
    if (errorCode.startsWith("auth/")) {
      return getFirebaseAuthErrorMessage(errorCode);
    }

    // Firestore errors
    if (errorCode.startsWith("firestore/")) {
      return getFirestoreErrorMessage(errorCode);
    }

    return `Error: ${errorCode}`;
  }

  return "An unexpected error occurred";
}

/**
 * Maps Firebase Auth error codes to user-friendly messages
 */
function getFirebaseAuthErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    "auth/email-already-in-use":
      "This email is already in use. Try logging in instead.",
    "auth/invalid-email": "The email address is invalid.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/weak-password": "Password is too weak. Use at least 6 characters.",
    "auth/popup-closed-by-user": "Sign-in popup was closed before completing.",
    "auth/popup-blocked": "Sign-in popup was blocked by your browser.",
    "auth/requires-recent-login":
      "Please log out and log back in to perform this action.",
    "auth/too-many-requests": "Too many failed attempts. Try again later.",
    "auth/email-not-verified": "Please verify your email before signing in.",
    "auth/account-exists-with-different-credential":
      "An account already exists with the same email but different sign-in credentials.",
    "auth/invalid-credential": "The credential is malformed or has expired.",
    "auth/operation-not-allowed": "This operation is not allowed.",
    "auth/invalid-verification-code": "The verification code is invalid.",
  };

  return errorMessages[code] || `Authentication error: ${code}`;
}

/**
 * Maps Firestore error codes to user-friendly messages
 */
function getFirestoreErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    "firestore/permission-denied":
      "You don't have permission to access this data.",
    "firestore/unavailable":
      "The service is currently unavailable. Please try again later.",
    "firestore/not-found": "The requested document was not found.",
    "firestore/already-exists": "The document already exists.",
    "firestore/cancelled": "The operation was cancelled.",
    "firestore/data-loss": "Unrecoverable data loss or corruption.",
    "firestore/deadline-exceeded": "The operation timed out.",
    "firestore/failed-precondition":
      "The operation failed due to a precondition not being met.",
    "firestore/internal": "An internal error occurred.",
    "firestore/invalid-argument": "An invalid argument was provided.",
    "firestore/out-of-range": "A value is outside of its valid range.",
    "firestore/resource-exhausted": "Resource limits have been exceeded.",
    "firestore/unauthenticated":
      "You need to be authenticated to perform this operation.",
  };

  return errorMessages[code] || `Database error: ${code}`;
}

/**
 * Core error handler that processes errors and returns standard format
 */
export function processError(
  error: AppError,
  customMessage?: string,
  showNotification = false,
): { message: string; code?: string } {
  const message = customMessage || getErrorMessage(error);
  const result = {
    message,
    code:
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code: string }).code
        : undefined,
  };

  // Log in development mode
  if (process.env.NODE_ENV !== "production") {
    console.error("Error details:", error);
  }

  // Show notification if requested
  if (showNotification) {
    toast.error(message);
  }

  return result;
}

/**
 * Displays an error message to the user
 */
export function handleError(error: AppError, customMessage?: string): void {
  processError(error, customMessage, true);
}

/**
 * Displays an info message to the user
 */
export function showInfo(message: string): void {
  toast(message, {
    icon: "ℹ️",
    style: {
      background: "#EFF6FF",
      color: "#1E40AF",
    },
  });
}

/**
 * Displays a success message to the user
 */
export function showSuccess(message: string): void {
  toast.success(message);
}

/**
 * Higher-order function to handle async operations with standardized error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage = "An error occurred",
  showErrorToast = true,
): Promise<ServiceResult<T>> {
  try {
    const result = await operation();
    return createSuccessResult(result);
  } catch (error) {
    const processedError = processError(error, errorMessage, showErrorToast);

    if (error instanceof ApiError) {
      return createErrorResult(error);
    }

    return createErrorResult(processedError.message);
  }
}

/**
 * Convert any error to an ApiError with proper structure
 */
export function toApiError(
  error: AppError,
  defaultMessage = "An unexpected error occurred",
): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (typeof error === "string") {
    return new ApiError(error, "generic/error");
  }

  if (error instanceof Error) {
    return new ApiError(error.message, "generic/error");
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    const errorObj = error as { code: string; message?: string };
    return new ApiError(
      errorObj.message || getErrorMessage(error),
      errorObj.code,
    );
  }

  return new ApiError(defaultMessage, "generic/unknown");
}

/**
 * Handles API errors by showing a toast notification and returning a user-friendly error message
 * @deprecated Use processError(error, customMessage, true) instead
 */
export function handleApiError(
  error: AppError,
  customMessage?: string,
): string {
  return processError(error, customMessage, true).message;
}

/**
 * Gets a user-friendly error message without showing a toast notification
 * @deprecated Use processError(error, customMessage, false) instead
 */
export function getApiErrorMessage(
  error: AppError,
  customMessage?: string,
): string {
  return processError(error, customMessage, false).message;
}
