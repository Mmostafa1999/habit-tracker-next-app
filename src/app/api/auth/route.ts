import { adminAuth } from "@/lib/firebase/admin";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// In-memory store for tracking authentication attempts
// In production, use Redis or similar for distributed systems
const authAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_AUTH_ATTEMPTS = 5;
const RESET_TIME_MS = 15 * 60 * 1000; // 15 minutes
const CSRF_TOKENS = new Map<string, { token: string; expires: number }>();
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

// Helper function to generate CSRF token
function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

// Rate limiting middleware
function checkRateLimit(ip: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const attempt = authAttempts.get(ip);

  if (!attempt) {
    authAttempts.set(ip, { count: 1, resetTime: now + RESET_TIME_MS });
    return { allowed: true };
  }

  // Reset counter if time expired
  if (now > attempt.resetTime) {
    authAttempts.set(ip, { count: 1, resetTime: now + RESET_TIME_MS });
    return { allowed: true };
  }

  // Check if rate limit exceeded
  if (attempt.count >= MAX_AUTH_ATTEMPTS) {
    return {
      allowed: false,
      message: `Too many authentication attempts. Please try again after ${Math.ceil((attempt.resetTime - now) / 60000)} minutes.`,
    };
  }

  // Increment counter
  attempt.count += 1;
  authAttempts.set(ip, attempt);
  return { allowed: true };
}

// Get CSRF token
export async function GET(request: NextRequest) {
  const sessionCookie = cookies().get("__session")?.value;

  // Generate a new CSRF token
  const csrfToken = generateCsrfToken();
  const now = Date.now();
  const expires = now + CSRF_TOKEN_EXPIRY;

  // Store the token with expiration
  CSRF_TOKENS.set(csrfToken, { token: csrfToken, expires });

  // Set as HttpOnly cookie and also return in response
  cookies().set("csrf_token", csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: CSRF_TOKEN_EXPIRY / 1000,
    path: "/",
  });

  return NextResponse.json({
    status: "success",
    csrfToken,
  });
}

// Handle login
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip =
      request.ip || request.headers.get("x-forwarded-for") || "unknown";

    // Check rate limiting
    const rateLimitCheck = checkRateLimit(ip);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: rateLimitCheck.message },
        { status: 429 },
      );
    }

    // Verify CSRF token
    const csrfTokenFromCookie = cookies().get("csrf_token")?.value;
    const { csrfToken, idToken } = await request.json();

    if (!csrfToken || csrfToken !== csrfTokenFromCookie) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 },
      );
    }

    // Validate the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Check if email is verified (for email/password auth)
    if (
      decodedToken.firebase.sign_in_provider === "password" &&
      !decodedToken.email_verified
    ) {
      return NextResponse.json(
        { error: "Email not verified" },
        { status: 403 },
      );
    }

    // Create session cookie
    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 2 weeks
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    // Set cookie
    cookies().set("__session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: expiresIn / 1000,
      path: "/",
    });

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Authentication error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 },
    );
  }
}

// Handle logout
export async function DELETE(request: NextRequest) {
  // Clear the session cookie
  cookies().set("__session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  // Clear the CSRF token cookie
  cookies().set("csrf_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  return NextResponse.json({ status: "success" });
}
