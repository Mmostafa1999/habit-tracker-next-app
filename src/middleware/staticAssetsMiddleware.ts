import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function handleStaticAssets(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Quick response for static assets that don't need auth checks
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Continue to other middleware for non-static paths
  return null;
} 