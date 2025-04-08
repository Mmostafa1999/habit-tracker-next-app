/**
 * Verifies authentication token with the server
 */
export async function verifyAuth(): Promise<boolean> {
  try {
    // Call the token verification API endpoint
    const response = await fetch("/api/auth/verify", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important for including cookies
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    console.error("Error verifying authentication:", error);
    return false;
  }
} 