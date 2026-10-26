// Runs in the browser before the app becomes interactive: Sentry error monitoring.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN) && process.env.NODE_ENV === "production",
  environment: process.env.NODE_ENV,
  // 10% of page loads are traced for performance; errors are always sent.
  tracesSampleRate: 0.1,
  // Never send customers' personal data: no user info, cookies or request bodies
  // (passwords, addresses, phone numbers).
  dataCollection: { userInfo: false, cookies: false, httpBodies: [] },
  // Noise from browser extensions and flaky mobile networks.
  ignoreErrors: ["ResizeObserver loop limit exceeded", "ResizeObserver loop completed with undelivered notifications", "Load failed", "NetworkError when attempting to fetch resource."],
});

// Lets Sentry follow App Router navigations.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
