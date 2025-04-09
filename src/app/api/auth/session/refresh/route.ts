import { adminAuth } from "@/lib/firebase/admin";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Helper function to generate a random token
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function GET(request: NextRequest) {
  try {
    // Get the current session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;

    // Get the callback URL from query params (for redirecting back after refresh)
    const callbackUrl =
      request.nextUrl.searchParams.get("callbackUrl") || "/dashboard";

    // If no session cookie, redirect to login
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // Verify the session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true,
    );

    // Create a new session cookie with a fresh expiry
    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 2 weeks
    const newSessionCookie = await adminAuth.createSessionCookie(
      // Use the decoded user ID to generate a new custom token
      await adminAuth.createCustomToken(decodedClaims.uid),
      { expiresIn },
    );

    // Set the new session cookie with updated expiry
    cookieStore.set("__session", newSessionCookie, {
      httpOnly: process.env.NODE_ENV === "production",
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: expiresIn / 1000,
      path: "/",
    });

    // Also generate a new CSRF token
    const csrfToken = generateToken();
    cookieStore.set("csrf_token", csrfToken, {
      httpOnly: process.env.NODE_ENV === "production",
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });

    // Redirect back to the original page
    return NextResponse.redirect(new URL(callbackUrl, request.url));
  } catch (error) {
    console.error("Session refresh error:", error);

    // Clear invalid session
    const cookieStore = await cookies();
    cookieStore.set("__session", "", {
      httpOnly: process.env.NODE_ENV === "production",
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 0,
      path: "/",
    });

    // Redirect to login
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}
