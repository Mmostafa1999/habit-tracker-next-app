import { adminAuth } from "@/lib/firebase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get the verification parameters from the URL
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");
    const continueUrl = searchParams.get("continueUrl") || "/dashboard";

    // Validate that this is an email verification request
    if (mode !== "verifyEmail" || !oobCode) {
      console.error("Invalid verification request");
      return NextResponse.redirect(
        new URL(
          `/auth/verify-email?error=invalid_request&callbackUrl=${encodeURIComponent(continueUrl || "/")}`,
          request.url,
        ),
      );
    }

    try {
      // Check the oobCode with Firebase Admin
      await adminAuth.checkActionCode(oobCode);

      // Apply the verification
      await adminAuth.applyActionCode(oobCode);

      // Email verified successfully
      return NextResponse.redirect(
        new URL(`${continueUrl}?email_verified=true`, request.url),
      );
    } catch (verifyError) {
      console.error("Email verification failed:", verifyError);

      // Handle different error cases
      return NextResponse.redirect(
        new URL(
          `/auth/verify-email?error=verification_failed&callbackUrl=${encodeURIComponent(continueUrl || "/")}`,
          request.url,
        ),
      );
    }
  } catch (error) {
    console.error("Email verification processing error:", error);
    return NextResponse.redirect(
      new URL("/auth/verify-email?error=server_error", request.url),
    );
  }
}
