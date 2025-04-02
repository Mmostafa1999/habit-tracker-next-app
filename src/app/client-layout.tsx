"use client";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import dynamic from "next/dynamic";
import { Poppins } from "next/font/google";
import { Suspense } from "react";

// Dynamically import contexts to reduce initial bundle size
const AuthProvider = dynamic(
  () =>
    import("@/lib/context/AuthContext").then(mod => ({
      default: mod.AuthProvider,
    })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    ),
  },
);


// Lazy load non-critical components
const Toaster = dynamic(() =>
  import("react-hot-toast").then(mod => mod.Toaster),
);



const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap", // For better font loading performance
});

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} font-sans antialiased bg-background/30  text-gray-900 `}
        suppressHydrationWarning>
          <AuthProvider>
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-screen">
                  <LoadingSpinner size="lg" />
                </div>
              }>
              {children}
            </Suspense>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#ffffff",
                  color: "#333333",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  borderRadius: "8px",
                  padding: "16px",
                  fontFamily: "var(--font-poppins), sans-serif",
                  fontSize: "14px",
                  fontWeight: "500",
                  border: "1px solid transparent",
                },
                success: {
                  style: {
                    background: "#f0fff4",
                    border: "1px solid #c6f6d5",
                  },
                  iconTheme: {
                    primary: "#10B981",
                    secondary: "#FFFFFF",
                  },
                  icon: "✅",
                },
                error: {
                  style: {
                    background: "#fff5f5",
                    border: "1px solid #fed7d7",
                  },
                  iconTheme: {
                    primary: "#EF4444",
                    secondary: "#FFFFFF",
                  },
                  icon: "❌",
                },
                className: "animate-fadeIn",
              }}
            />
          </AuthProvider>
      </body>
    </html>
  );
}
