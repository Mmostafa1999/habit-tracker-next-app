"use client";

import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface LoadingFallbackProps {
    fullScreen?: boolean;
}

export default function LoadingFallback({ fullScreen = true }: LoadingFallbackProps) {
    return (
        <div
            className={`flex items-center justify-center ${fullScreen ? "min-h-screen" : "w-full py-8"
                }`}
        >
            <LoadingSpinner size="lg" />
        </div>
    );
} 