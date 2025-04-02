import type { Metadata } from "next";
import ClientLayout from "./client-layout";
import "./globals.css";

export const metadata: Metadata = {
  title: "HabitTracker - Track Your Daily Habits",
  description:
    "A simple application to track your daily habits and build consistency",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
}
