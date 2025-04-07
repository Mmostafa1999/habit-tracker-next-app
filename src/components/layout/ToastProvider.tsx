"use client";

import { toastConfig } from "@/lib/config/toastConfig";
import dynamic from "next/dynamic";

// Lazy load non-critical components
const Toaster = dynamic(() =>
  import("react-hot-toast").then(mod => mod.Toaster)
);

export default function ToastProvider() {
  return (
    <Toaster
      position={toastConfig.position}
      toastOptions={toastConfig.toastOptions}
    />
  );
} 