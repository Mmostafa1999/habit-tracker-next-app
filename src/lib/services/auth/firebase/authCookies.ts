/**
 * Sets authentication cookies via server API
 */

export async function setAuthCookies(idToken: string): Promise<void> {
  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Try to parse the error data to check for specific errors
      try {
        const parsedError = JSON.parse(errorText);
        if (parsedError.error === "Email not verified") {
          throw new Error(
            "Email not verified. Please verify your email before logging in.",
          );
        }
      } catch {
        // If we can't parse the error, just use the original error message
      }

      throw new Error("Failed to set authentication cookies");
    }
  } catch (error) {
    // Log the error but don't show toast (AuthContext will handle the toast)
    throw error;
  }
}

/**
 * Clears authentication cookies via server API
 */
export async function clearAuthCookies(): Promise<void> {
  try {
    const response = await fetch("/api/auth", {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to clear authentication cookies");
    }
  } catch (error) {
    // Log the error but don't show toast (AuthContext will handle the toast)
    throw error;
  }
}
