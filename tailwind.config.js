/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#E50046",
          light: "rgba(var(--color-primary), 0.9)",
          hover: "#D00040",
        },
        secondary: "#FDAB9E",
        accent: "#FFF0BD",
        background: "#C7DB9C",
        gray: {
          50: "rgb(var(--color-gray-50))",
          100: "rgb(var(--color-gray-100))",
          200: "rgb(var(--color-gray-200))",
          300: "rgb(var(--color-gray-300))",
          400: "rgb(var(--color-gray-400))",
          500: "rgb(var(--color-gray-500))",
          600: "rgb(var(--color-gray-600))",
          700: "rgb(var(--color-gray-700))",
          800: "rgb(var(--color-gray-800))",
          900: "rgb(var(--color-gray-900))",
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "sans-serif"],
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-in-out",
        slideUp: "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      boxShadow: {
        card: "0 4px 20px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
