import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// Records a customer search (sent with navigator.sendBeacon from the search bar).
export async function POST(request: Request) {
  let body: { q?: unknown; results?: unknown };
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }

  const q = typeof body.q === "string" ? body.q.slice(0, 80) : "";
  const results = Number.isFinite(body.results) ? Math.max(0, Math.floor(body.results as number)) : 0;
  if (q.trim().length < 2) return new Response(null, { status: 204 });

  const ip = await clientIp();
  const normalized = q.trim().toLowerCase();
  const allowed =
    (await rateLimit(`search:${ip}`, 60, 3600)) && (await rateLimit(`search:${ip}:${normalized}`, 1, 3600));
  if (!allowed) return new Response(null, { status: 204 });

  // Fails quietly until supabase/search_suggestions.sql has been run.
  await createAdminClient().rpc("log_search", { p_query: q, p_results: results });

  return new Response(null, { status: 204 });
}
