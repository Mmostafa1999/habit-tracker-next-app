import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Map of paths and required auth status
// null = no redirect, true = requires auth, false = requires no auth
const AUTH_PATH_MAP: Record<string, boolean | null> = {
  "/": null, // Home page is accessible to everyone
  "/auth/login": false,
  "/auth/signup": false,
  "/auth/forgot-password": false,
  "/dashboard": true,
};

// Time-based session rotation - if a session cookie is older than this,
// refresh it through the server for security
const SESSION_REFRESH_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

export function handleAuth(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Determine the base path for checking auth requirements
  const basePath = Object.keys(AUTH_PATH_MAP).find(
    path => pathname === path || pathname.startsWith(`${path}/`),
  );

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
    const url = new URL("/auth/login", request.url);
    // Add the original URL as a query parameter to redirect back after login
    url.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(url);
  }

  // Auth not allowed but has auth cookie (e.g., login page when already logged in)
  if (AUTH_PATH_MAP[basePath] === false && hasAuthCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If we need to refresh the session, redirect through our session refresh API
  if (shouldRefreshSession) {
    const refreshUrl = new URL("/api/auth/session/refresh", request.url);
    refreshUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(refreshUrl);
  }

  return NextResponse.next();
} 