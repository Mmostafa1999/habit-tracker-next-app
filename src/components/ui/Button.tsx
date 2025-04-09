"use client";

import React from "react";
import LoadingSpinner from "./LoadingSpinner";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  type = "button",
  onClick,
  icon,
  className = "",
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white";

  const variantClasses = {
    primary:
      "bg-[#E50046] text-white hover:bg-[#E50046]/90 focus:bg-[#E50046]/80 active:bg-[#E50046]/80 focus:ring-[#E50046]/50 shadow-sm hover:shadow transform hover:-translate-y-0.5",
    secondary:
      "bg-secondary text-gray-800 hover:bg-secondary-light focus:bg-secondary/80 active:bg-secondary/80 focus:ring-secondary/50 shadow-sm hover:shadow transform hover:-translate-y-0.5",
    outline:
      "bg-white text-gray-800 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 focus:ring-gray-200 active:bg-gray-100 shadow-sm hover:shadow transform hover:-translate-y-0.5",
  };

  const sizeClasses = {
    sm: "text-sm px-3 py-1.5 rounded-md",
    md: "text-base px-4 py-2 rounded-md",
    lg: "text-lg px-6 py-3 rounded-lg",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${
        baseClasses
      } ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${
        disabled ? "opacity-60 cursor-not-allowed" : "hover-scale"
      } ${loading ? "relative" : ""} ${className}`}
    >
      {loading ? (
        <>
          <span className="opacity-0">{children}</span>
          <span className="absolute inset-0 flex items-center justify-center bg-opacity-70 bg-white rounded-md">
            <LoadingSpinner
              size={size === "lg" ? "md" : size === "md" ? "sm" : "sm"}
              color={variant === "primary" ? "white" : "gray"}
            />
          </span>
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
