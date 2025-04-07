"use client";

import LoadingFallback from "@/components/layout/LoadingFallback";
import dynamic from "next/dynamic";
import { Suspense } from "react";

// Dynamically import contexts to reduce initial bundle size
const AuthProvider = dynamic(
    () =>
        import("@/lib/context/AuthContext").then(mod => ({
            default: mod.AuthProvider,
        })),
    {
        loading: () => <LoadingFallback />,
    }
);

interface ProvidersProps {
    children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    return (
        <AuthProvider>
            <Suspense fallback={<LoadingFallback />}>
                {children}
            </Suspense>
        </AuthProvider>
    );
} 