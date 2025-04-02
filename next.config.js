/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "lh3.googleusercontent.com", // Google profile pictures
      "firebasestorage.googleapis.com", // Firebase storage
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"], // Use modern image formats
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production", // Remove console in production
  },
  experimental: {
    optimizeCss: true, // Optimize CSS
    scrollRestoration: true, // Better scroll position restoration
  },
  reactStrictMode: false, // Disable strict mode for production (can cause double rendering)
  poweredByHeader: false, // Remove X-Powered-By header
  compress: true, // Enable compression
  productionBrowserSourceMaps: false, // Disable source maps in production for better performance
  // Add optimization for faster builds and better code splitting
  webpack: (config, { dev, isServer }) => {
    // Only in production builds
    if (!dev) {
      // Reduce bundle size by replacing process.env.NODE_ENV with 'production'
      config.plugins.push(
        new config.webpack.DefinePlugin({
          "process.env.NODE_ENV": JSON.stringify("production"),
        }),
      );

      // Ignore source maps in node_modules for faster builds
      config.resolve.alias = {
        ...config.resolve.alias,
        "@sentry/node": "@sentry/browser",
      };
    }

    return config;
  },
  // Add security headers including Content Security Policy
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
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
      "https://*.firebaseio.com",
      "https://*.googleapis.com",
    ],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "img-src": ["'self'", "data:", "https:", "blob:"],
    "font-src": ["'self'", "https://fonts.gstatic.com"],
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

  // Add reporting URL if provided
  if (process.env.CSP_REPORT_URI) {
    policy["report-uri"] = [process.env.CSP_REPORT_URI];
  }

  // Convert policy object to CSP string
  return Object.entries(policy)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key;
      }
      return `${key} ${values.join(" ")}`;
    })
    .join("; ");
}

module.exports = nextConfig;
