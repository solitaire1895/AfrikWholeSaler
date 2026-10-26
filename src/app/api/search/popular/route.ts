import { createClient } from "@supabase/supabase-js";

// Most common customer searches, for the search bar's suggestions.
// Cached and refreshed every 5 minutes; filtered by prefix in the browser.
export const dynamic = "force-static";
export const revalidate = 300;

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase.rpc("popular_searches", { p_limit: 200 });

  // Before supabase/search_suggestions.sql is run the function doesn't
  // exist — return an empty list so the search bar still works.
  const searches = error ? [] : ((data ?? []) as { query: string; hits: number }[]);

  return Response.json(
    { searches },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=3600" } }
  );
}
