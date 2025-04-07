// Toast configuration for react-hot-toast
export const toastConfig = {
  position: "top-right" as const,
  toastOptions: {
    duration: 4000,
    style: {
      background: "#ffffff",
      color: "#333333",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      borderRadius: "8px",
      padding: "16px",
      fontFamily: "sans-serif",
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
  },
};
