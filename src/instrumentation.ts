// Server-side observability: Sentry for the Node.js and Edge runtimes.
import * as Sentry from "@sentry/nextjs";

export function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    enabled: process.env.NODE_ENV === "production",
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    // Never send customers' personal data: no user info, cookies or request bodies
    // (passwords, addresses, phone numbers).
    dataCollection: { userInfo: false, cookies: false, httpBodies: [] },
  });
}

// Errors thrown while rendering pages, in server actions and in route handlers
// (payments, SasPay webhooks, payouts…) are reported to Sentry.
export const onRequestError = Sentry.captureRequestError;
