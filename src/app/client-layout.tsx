"use client";

// Import this first to ensure it runs before any Firebase code
import "@/lib/utils/localStorageCleanup";

import Providers from "@/components/layout/Providers";
import ToastProvider from "@/components/layout/ToastProvider";

// Define font class - use system fonts instead of Google Fonts to avoid network dependency
const fontClass = "font-sans";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${fontClass} antialiased bg-background/30 text-gray-900`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
          <ToastProvider />
        </Providers>
      </body>
    </html>
  );
}
