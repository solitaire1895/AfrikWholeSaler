import { createBrowserClient } from "@supabase/ssr";

/**
 * Cookie options for persistent sessions.
 * Default: 30-day persistent cookies so users don't have to log in each visit.
 * When rememberMe is false, the login page overwrites these with session-only cookies.
 */
export const persistentCookieOptions = {
  maxAge: 60 * 60 * 24 * 30, // 30 days
  sameSite: "lax" as const,
  secure: true,
  path: "/",
};

/**
 * Cookie options for session-only (cleared when browser closes).
 * Used when "Remember me" is unchecked on login.
 */
export const sessionCookieOptions = {
  maxAge: undefined, // session cookie — no expiry
  sameSite: "lax" as const,
  secure: true,
  path: "/",
};

/**
 * Creates a Supabase client for use in Client Components.
 * Uses the singleton pattern by default to avoid multiple instances.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: persistentCookieOptions,
    }
  );
}
