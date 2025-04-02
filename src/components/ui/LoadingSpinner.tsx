"use client";

import React, { ReactElement } from "react";

type SpinnerSize = "sm" | "md" | "lg" | "xl";

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
  color?: string;
}

/**
 * LoadingSpinner component for showing loading states throughout the application
 * 
 * @param {LoadingSpinnerProps} props - Component properties
 * @returns {ReactElement} - A spinner animation component
 */
export default function LoadingSpinner({
  size = "md",
  className = "",
  color = "#E50046", // Using primary brand color
}: LoadingSpinnerProps): ReactElement {
  // Map size names to pixel dimensions
  const sizeMap: Record<SpinnerSize, string> = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const spinnerSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-block ${spinnerSize} ${className}`} role="status" aria-label="Loading">
      <svg className={`${spinnerSize} text-[#E50046] animate-spin`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color }}>
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.24 16.83L11 13.69V7H12.5V12.87L17 15.5L16.24 16.83Z" fill="currentColor"></path>
      </svg>
    </div>
  );
}
