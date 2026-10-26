import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses RLS.
 * Only for trusted server code with no user session (e.g. payment webhooks).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_API_KEY!, // service_role key
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
