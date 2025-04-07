import type { NextRequest } from "next/server";
import { handleAuth } from "./src/middleware/authMiddleware";
import { handleCsrfProtection } from "./src/middleware/csrfMiddleware";
import { handleStaticAssets } from "./src/middleware/staticAssetsMiddleware";

/**
 * Main middleware function that orchestrates all middleware components
 */
export function middleware(request: NextRequest) {
  // First, check if this is a static asset request
  const staticResponse = handleStaticAssets(request);
  if (staticResponse) {
    return staticResponse;
  }

  // For API routes, enforce CSRF protection
  if (request.nextUrl.pathname.startsWith("/api")) {
    return handleCsrfProtection(request);
  }

  // For all other routes, apply authentication middleware
  return handleAuth(request);
}

// Only run middleware on specified routes
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
