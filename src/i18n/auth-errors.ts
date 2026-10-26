import type { Dictionary } from "./dictionary";

/** Supabase auth errors in the visitor's language (falls back to Supabase's text). */
export function authErrorMessage(t: Dictionary, message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return t.auth.errors.invalidCredentials;
  if (m.includes("email not confirmed")) return t.auth.errors.emailNotConfirmed;
  if (m.includes("already registered") || m.includes("already exists")) return t.auth.errors.alreadyRegistered;
  return message;
}
