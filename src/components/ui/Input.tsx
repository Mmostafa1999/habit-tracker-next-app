"use client";

import React, { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  fullWidth = true,
  className = "",
  icon,
  ...props
}: InputProps) {
  return (
    <div
      className={`${fullWidth ? "w-full" : ""} mb-4 transition-all duration-200`}>
      {label && (
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-gray-700  mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 ">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full px-4 py-2.5 bg-white  border border-gray-300  rounded-md shadow-sm 
            placeholder-gray-400  text-gray-900 
            focus:outline-none focus:ring-2 focus:ring-[#E50046]/50 focus:border-[#E50046] 
            transition-all duration-200 ${icon ? "pl-10" : ""} 
            ${error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}
            hover:border-gray-400 
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600  animate-slideUp">
          {error}
        </p>
      )}
    </div>
  );
}
