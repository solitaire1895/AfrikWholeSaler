import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

// Sent with every response.
const securityHeaders = [
  // No other site may embed ours in a frame (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self' https://*.saspay.me" },
  // HTTPS only, for two years, subdomains included.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Browsers must not guess file types (an "image" can't run as a script).
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The site doesn't use the camera, microphone or location.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "hqhcbmwnnhzqrjhrpsxc.supabase.co",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG ?? "afrikwholesaler",
  project: process.env.SENTRY_PROJECT,
  // Source maps are uploaded only when SENTRY_AUTH_TOKEN is set (readable stack traces).
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // Send browser errors through our own domain so ad blockers don't drop them.
  tunnelRoute: "/monitoring",
});
