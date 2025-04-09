import { adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get the session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;

    // If no session cookie, the user is not authenticated
    if (!sessionCookie) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Verify the session cookie
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(
        sessionCookie,
        true,
      );

      // Get the user data from Firebase
      const user = await adminAuth.getUser(decodedClaims.uid);

      // Return user data
      return NextResponse.json({
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
        },
      });
    } catch (error) {
      console.error("Session verification error:", error);
      return NextResponse.json({ user: null }, { status: 401 });
    }
  } catch (error) {
    console.error("User data fetch error:", error);
    return NextResponse.json(
      { user: null, error: "Failed to fetch user data" },
      { status: 500 },
    );
  }
}
