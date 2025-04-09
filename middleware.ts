import { NextRequest, NextResponse } from "next/server";

// Define protected routes that require authentication
const protectedRoutes = ["/dashboard", "/profile", "/habits", "/achievements"];

// Authentication routes
const authRoutes = ["/auth/login", "/auth/signup", "/auth/forgot-password"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Handle Firebase authentication actions (email verification, password reset, etc.)
  if (pathname.includes("/__/auth/action")) {
    // Extract the mode parameter to determine the action type
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode");
    const oobCode = url.searchParams.get("oobCode");

    // Handle email verification
    if (mode === "verifyEmail" && oobCode) {
      // Redirect to our custom handler with the original parameters
      const redirectUrl = new URL(
        `/api/auth/email-verification${search}`,
        request.url,
      );
      return NextResponse.redirect(redirectUrl);
    }

    // Pass through other Firebase auth actions
    return NextResponse.next();
  }

  // Special handling for verify-email page to prevent redirect loops
  if (pathname === "/auth/verify-email") {
    // Check if we're coming from a verification attempt
    const verificationAttempted = request.cookies.get("verification_attempted");

    if (verificationAttempted) {
      // Allow access to the verify-email page without further redirects
      // This prevents redirect loops
      const response = NextResponse.next();

      // Clear the verification attempted cookie
      response.cookies.delete("verification_attempted");

      return response;
    }
  }

  // Always let authentication pages load regardless of auth status
  if (
    pathname === "/" ||
    pathname === "/auth/login" ||
    pathname === "/auth/signup" ||
    pathname === "/auth/forgot-password"
  ) {
    return NextResponse.next();
  }

  try {
    // Check if the user is authenticated by calling the verification API
    const verifyResponse = await fetch(
      new URL("/api/auth/verify", request.url),
    );
    const { valid } = await verifyResponse.json();

    // User is trying to access a protected route but is not authenticated
    if (protectedRoutes.some(route => pathname.startsWith(route)) && !valid) {
      // Set cookie to track that verification was required
      const redirectUrl = new URL(
        `/auth/login?callbackUrl=${encodeURIComponent(pathname + search)}`,
        request.url,
      );
      return NextResponse.redirect(redirectUrl);
    }

    // User is already authenticated but trying to access auth pages
    if (authRoutes.some(route => pathname === route) && valid) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Email verification check for authenticated users
    if (valid) {
      // Verify if email is verified - do this for ALL routes, not just protected ones
      const userVerifyResponse = await fetch(
        new URL("/api/auth/user", request.url),
      );
      const userData = await userVerifyResponse.json();

      // If email is not verified, redirect to verification page
      if (userData.user && !userData.user.emailVerified) {
        // Skip verification check for specific routes like verify-email page itself
        if (pathname === "/auth/verify-email") {
          return NextResponse.next();
        }

        // Set a cookie to track verification was attempted to prevent loops
        const response = NextResponse.redirect(
          new URL(
            `/auth/verify-email?email=${encodeURIComponent(userData.user.email || "")}&callbackUrl=${encodeURIComponent(pathname + search)}`,
            request.url,
          ),
        );

        response.cookies.set("verification_attempted", "true", {
          maxAge: 60, // 1 minute
          path: "/",
        });

        return response;
      }
    }
  } catch (error) {
    console.error("Middleware authentication error:", error);
    // On error, allow the request to proceed to let the page handle the error
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * But include:
     * - /api/auth/* (auth API routes)
     * - __/auth/action (Firebase auth action URLs)
     * - Protected routes
     * - Auth routes
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
    "/__/auth/action",
  ],
};
