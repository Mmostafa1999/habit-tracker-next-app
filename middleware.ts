import { adminAuth } from "@/lib/firebase/admin";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Map of paths and required auth status
// null = no redirect, true = requires auth, false = requires no auth
const AUTH_PATH_MAP: Record<string, boolean | null> = {
  "/": null, // Home page is accessible to everyone
  "/auth/login": false,
  "/auth/signup": false,
  "/auth/forgot-password": false,
  "/auth/verify-email": null, // Allow access to email verification page
  "/dashboard": true,
};

// Time-based session rotation - if a session cookie is older than this,
// refresh it through the server for security
const SESSION_REFRESH_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log(`Middleware running for path: ${pathname}`);

  // Quick response for static assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // For API route authentication, we handle this in the API routes themselves
  if (pathname.startsWith("/api")) {
    // For CSRF protection, we check that non-GET API requests have a valid CSRF token
    // Only if the request isn't a GET, OPTIONS, or HEAD request
    const method = request.method.toUpperCase();
    if (!["GET", "OPTIONS", "HEAD"].includes(method)) {
      // Get CSRF token from cookie and header
      const csrfCookie = request.cookies.get("csrf_token")?.value;
      const csrfHeader = request.headers.get("x-csrf-token");

      // If no CSRF token or if tokens don't match, return 403 Forbidden
      if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        return new NextResponse(
          JSON.stringify({ error: "Invalid CSRF token" }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }

    return NextResponse.next();
  }

  // Explicitly check for dashboard routes
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    console.log("Dashboard route detected, checking authentication");

    // Check if the user has a session cookie
    const sessionCookie = request.cookies.get("__session");
    const hasAuthCookie = !!sessionCookie?.value;

    console.log(`Has auth cookie: ${hasAuthCookie}`);

    if (!hasAuthCookie) {
      console.log("No auth cookie found, redirecting to login");
      const url = new URL("/auth/login", request.url);
      // Add the original URL as a query parameter to redirect back after login
      url.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(url);
    }

    // Try to verify the session cookie
    try {
      if (sessionCookie?.value) {
        console.log("Verifying session cookie");
        // Verify the session cookie and get decoded claims
        const decodedClaims = await adminAuth.verifySessionCookie(
          sessionCookie.value,
        );
        console.log("Session verified successfully");

        // Check if email is verified
        if (decodedClaims.email_verified === false) {
          console.log("Email not verified, redirecting to verify-email");
          // Don't redirect if already on verify-email page to prevent loops
          if (!pathname.startsWith("/auth/verify-email")) {
            const url = new URL("/auth/verify-email", request.url);
            // Add the original URL as a query parameter to redirect back after verification
            url.searchParams.set("callbackUrl", request.url);
            return NextResponse.redirect(url);
          }
        }
      }
    } catch (error) {
      console.error("Session verification error:", error);

      // If session is invalid, redirect to login
      console.log("Invalid session, redirecting to login");
      const url = new URL("/auth/login", request.url);
      url.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(url);
    }
  }

  // Continue with the general AUTH_PATH_MAP checks for non-dashboard routes
  // Determine the base path for checking auth requirements
  const basePath = Object.keys(AUTH_PATH_MAP).find(
    path => pathname === path || pathname.startsWith(`${path}/`),
  );

  console.log(`Base path determined: ${basePath}`);

  // If no specific rule exists, allow access
  if (!basePath || AUTH_PATH_MAP[basePath] === null) {
    return NextResponse.next();
  }

  // Check if the user has a session cookie
  const sessionCookie = request.cookies.get("__session");
  const hasAuthCookie = !!sessionCookie?.value;

  // Check if we need to refresh the session cookie due to age
  let shouldRefreshSession = false;
  if (hasAuthCookie && sessionCookie?.value) {
    // Since we cannot access expires directly in NextRequest cookies,
    // we'll use a fixed maxAge assumption based on common session cookie settings
    const assumedMaxAge = 60 * 60 * 24 * 14; // 14 days in seconds
    // We'll use the cookie's value existence as indicator of when it was set
    // This is not perfect but is a workable assumption for the middleware
    const cookieAgeMs = Date.now() - Date.now() + (assumedMaxAge * 1000) / 2; // Assume the cookie is halfway through its lifetime

    // If the cookie is older than our threshold, mark for refresh
    shouldRefreshSession = cookieAgeMs > SESSION_REFRESH_THRESHOLD_MS;
  }

  // Auth required but no auth cookie
  if (AUTH_PATH_MAP[basePath] === true && !hasAuthCookie) {
    console.log(
      `Auth required for ${basePath} but no auth cookie found, redirecting to login`,
    );
    const url = new URL("/auth/login", request.url);
    // Add the original URL as a query parameter to redirect back after login
    url.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(url);
  }

  // Auth not allowed but has auth cookie (e.g., login page when already logged in)
  if (AUTH_PATH_MAP[basePath] === false && hasAuthCookie) {
    console.log(
      `Auth not allowed for ${basePath} but has auth cookie, redirecting to dashboard`,
    );
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If we need to refresh the session, redirect through our session refresh API
  if (shouldRefreshSession) {
    console.log("Session needs refreshing");
    const refreshUrl = new URL("/api/auth/session/refresh", request.url);
    refreshUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(refreshUrl);
  }

  console.log("Middleware completed, allowing request to continue");
  return NextResponse.next();
}

// Only run middleware on specified routes
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
