import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function handleCsrfProtection(request: NextRequest) {
  // Only check CSRF for API routes
  if (!request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // For CSRF protection, we check that non-GET API requests have a valid CSRF token
  // Only if the request isn't a GET, OPTIONS, or HEAD request
  const method = request.method.toUpperCase();
  if (!["GET", "OPTIONS", "HEAD"].includes(method)) {
    // Get CSRF token from cookie and header
    const csrfCookie = request.cookies.get("csrf_token")?.value;
    const csrfHeader = request.headers.get("x-csrf-token");

    // If no CSRF token or if tokens don't match, return 403 Forbidden
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      return new NextResponse(JSON.stringify({ error: "Invalid CSRF token" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return NextResponse.next();
}
