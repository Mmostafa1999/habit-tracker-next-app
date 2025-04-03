import { adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get the session cookie
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("__session")?.value;

    // If no session cookie, the user is not authenticated
    if (!sessionCookie) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    // Verify the session cookie
    try {
      // The second parameter (true) checks if the cookie was revoked
      await adminAuth.verifySessionCookie(sessionCookie, true);

      // Cookie is valid
      return NextResponse.json({ valid: true });
    } catch {
      // Invalid or expired cookie
      return NextResponse.json({ valid: false }, { status: 401 });
    }
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to verify token" },
      { status: 500 },
    );
  }
}
