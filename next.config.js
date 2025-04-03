// ESLint doesn't like require, but next.config.js is a CommonJS module
// eslint-disable-next-line
const { DefinePlugin } = require("webpack");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "lh3.googleusercontent.com", // Google profile pictures
      "firebasestorage.googleapis.com", // Firebase storage
    ],
    remotePatterns: [
      // Either remove empty hostname pattern or provide valid hostname
      /* Commenting out invalid remote pattern
      {
        protocol: "https",
        hostname: "",
      },
      */
    ],
    formats: ["image/avif", "image/webp"], // Use modern image formats
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production", // Remove console logs in production
  },
  experimental: {
    // optimizeCss: true, // Disable CSS optimization to avoid critters issues
    scrollRestoration: true, // Better scroll position restoration
  },
  reactStrictMode: false, // Disable strict mode for production (to prevent double rendering)
  poweredByHeader: false, // Remove X-Powered-By header for security
  compress: true, // Enable compression for performance
  productionBrowserSourceMaps: false, // Disable source maps in production

  // Enable ESLint during builds
  eslint: {
    ignoreDuringBuilds: false, // Enable ESLint during builds
  },

  // Enable TypeScript type checking
  typescript: {
    ignoreBuildErrors: false, // Enable type checking during builds
  },

  // Webpack Optimization
  webpack: (config, { dev }) => {
    if (!dev) {
      config.plugins.push(
        new DefinePlugin({
          "process.env.NODE_ENV": JSON.stringify("production"),
        }),
      );

      // Reduce unnecessary package size
      config.resolve.alias = {
        ...config.resolve.alias,
        "@sentry/node": "@sentry/browser",
      };
    }
    return config;
  },

  // Security Headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              process.env.CSP_REPORT_ONLY === "true"
                ? generateCSP(true)
                : generateCSP(false),
          },
        ],
      },
    ];
  },
};

// Generate Content Security Policy
function generateCSP(reportOnly) {
  const policy = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "https://apis.google.com",
      "https://.firebaseio.com",
      "https://.googleapis.com",
    ],
    "style-src": ["'self'", "'unsafe-inline'"], // Removed Google Fonts temporarily
    "img-src": ["'self'", "data:", "https:", "blob:"],
    "font-src": ["'self'"], // Removed Google Fonts temporarily
    "frame-src": [
      "'self'",
      "https://*.firebaseapp.com",
      "https://accounts.google.com",
    ],
    "connect-src": [
      "'self'",
      "https://*.googleapis.com",
      "https://*.firebaseio.com",
      "https://*.cloudfunctions.net",
      "wss://*.firebaseio.com",
      "https://*.firebase.googleapis.com",
      "https://*.firebaseauth.com",
    ],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'self'"],
    "block-all-mixed-content": [],
    "upgrade-insecure-requests": [],
  };

  // Only add report-uri if CSP_REPORT_URI is defined and not empty
  const reportUri = process.env.CSP_REPORT_URI;
  if (reportUri && typeof reportUri === "string" && reportUri.trim() !== "") {
    policy["report-uri"] = [reportUri];
  }

  // Add report-to directive if enabled and CSP_REPORT_URI is defined
  if (
    reportOnly &&
    reportUri &&
    typeof reportUri === "string" &&
    reportUri.trim() !== ""
  ) {
    policy["report-to"] = ["csp-endpoint"];
  }

  return Object.entries(policy)
    .map(([key, values]) => {
      // Handle empty arrays safely
      if (values.length === 0) {
        return key;
      }
      // Make sure all values are non-empty strings before joining
      const validValues = values.filter(
        val => typeof val === "string" && val.trim() !== "",
      );
      return `${key} ${validValues.join(" ")}`;
    })
    .join("; ");
}

module.exports = nextConfig;
