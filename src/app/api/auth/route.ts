import { adminAuth } from "@/lib/firebase/admin";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// In-memory store for tracking authentication attempts (Use Redis in production)
const authAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_AUTH_ATTEMPTS = 5;
const RESET_TIME_MS = 15 * 60 * 1000; // 15 minutes
const CSRF_TOKENS = new Map<string, { token: string; expires: number }>();
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

function checkRateLimit(ip: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const attempt = authAttempts.get(ip);

  if (!attempt) {
    authAttempts.set(ip, { count: 1, resetTime: now + RESET_TIME_MS });
    return { allowed: true };
  }

  if (now > attempt.resetTime) {
    authAttempts.set(ip, { count: 1, resetTime: now + RESET_TIME_MS });
    return { allowed: true };
  }

  if (attempt.count >= MAX_AUTH_ATTEMPTS) {
    return {
      allowed: false,
      message: `Too many authentication attempts. Try again in ${Math.ceil((attempt.resetTime - now) / 60000)} minutes.`,
    };
  }

  attempt.count += 1;
  authAttempts.set(ip, attempt);
  return { allowed: true };
}

// Handle GET: Generate CSRF token
export async function GET() {
  const csrfToken = generateCsrfToken();
  const now = Date.now();
  const expires = now + CSRF_TOKEN_EXPIRY;

  CSRF_TOKENS.set(csrfToken, { token: csrfToken, expires });

  const cookieStore = await cookies();
  cookieStore.set("csrf_token", csrfToken, {
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

// Handle POST: Login
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimitCheck = checkRateLimit(ip);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json({ error: rateLimitCheck.message }, { status: 429 });
    }

    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: "No ID token provided" }, { status: 400 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);

    if (
      decodedToken.firebase.sign_in_provider === "password" &&
      !decodedToken.email_verified
    ) {
      return NextResponse.json(
        {
          error: "Email not verified",
          message: "Please verify your email before logging in.",
        },
        { status: 403 },
      );
    }

    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 2 weeks
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    const cookieStore = await cookies();

    cookieStore.set("__session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: expiresIn / 1000,
      path: "/",
    });

    const csrfToken = generateCsrfToken();
    cookieStore.set("csrf_token", csrfToken, {
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

// Handle DELETE: Logout
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set("__session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  cookieStore.set("csrf_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  return NextResponse.json({ status: "success" });
}
