"use client";

import Button from "@/components/ui/Button";
import { auth } from "@/lib/services/auth/firebase/firebaseConfig";
import { sendEmailVerification } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
    const [isResending, setIsResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    const email = searchParams.get("email") || "your email";
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
    const error = searchParams.get("error");
    const emailVerified = searchParams.get("email_verified");

    useEffect(() => {
        // Handle error from URL if present
        if (error) {
            let errorMsg = "An error occurred during email verification";

            switch (error) {
                case "invalid_request":
                    errorMsg = "Invalid verification request. Please try again.";
                    break;
                case "verification_failed":
                    errorMsg = "Email verification failed. The link may have expired.";
                    break;
                case "server_error":
                    errorMsg = "Server error occurred. Please try again later.";
                    break;
                default:
                    errorMsg = "An error occurred during verification. Please try again.";
            }

            setErrorMessage(errorMsg);
        }

        // Handle successful verification
        if (emailVerified === "true") {
            // Redirect to the callback URL after a short delay
            const timer = setTimeout(() => {
                router.push(callbackUrl);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [error, emailVerified, router, callbackUrl]);

    const handleResendVerification = async () => {
        setIsResending(true);
        try {
            const currentUser = auth.currentUser;

            if (!currentUser) {
                throw new Error("No authenticated user found. Please sign in first.");
            }

            if (currentUser.emailVerified) {
                throw new Error("Your email is already verified.");
            }

            await sendEmailVerification(currentUser);

            setResendSuccess(true);
            setErrorMessage(null);
        } catch (error: any) {
            console.error("Error sending verification email:", error);
            setErrorMessage(error.message || "Failed to send verification email");
        } finally {
            setIsResending(false);
        }
    };

    const handleContinue = () => {
        router.push(callbackUrl);
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
                <div className="space-y-1 text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Verify Your Email</h1>
                    <p className="text-gray-600">
                        We've sent a verification link to <span className="font-medium">{email}</span>
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                        <p className="text-sm text-blue-800">
                            Please check your email and click the verification link to activate your account.
                            If you don't see the email, check your spam folder.
                        </p>
                    </div>

                    {errorMessage && (
                        <div className="bg-red-50 p-4 rounded-md border border-red-100">
                            <p className="text-sm text-red-800">{errorMessage}</p>
                        </div>
                    )}

                    {resendSuccess && (
                        <div className="bg-green-50 p-4 rounded-md border border-green-100">
                            <p className="text-sm text-green-800">
                                A new verification link has been sent to your email.
                            </p>
                        </div>
                    )}

                    {emailVerified === "true" && (
                        <div className="bg-green-50 p-4 rounded-md border border-green-100">
                            <p className="text-sm text-green-800">
                                Your email has been successfully verified! Redirecting you back...
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col space-y-2 mt-6">
                    <Button
                        onClick={handleResendVerification}
                        disabled={isResending || resendSuccess || emailVerified === "true"}
                        variant="outline"
                        fullWidth
                    >
                        {isResending ? "Sending..." : resendSuccess ? "Email Sent" : "Resend Verification Email"}
                    </Button>
                    <Button
                        onClick={handleContinue}
                        fullWidth
                    >
                        Continue to App
                    </Button>
                </div>
            </div>
        </div>
    );
} 