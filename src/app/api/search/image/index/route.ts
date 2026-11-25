import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { indexKey, parseEmbedding, pendingProductPhotos, toVector } from "@/lib/visual-search";

// Admin only. The admin's browser computes the embeddings:
// GET  ?model=… → next product photos to index (+ how many remain)
// POST { model, items: [{ id, url, embedding }] } → stores them

async function isAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return Boolean(profile && ["admin", "super_admin"].includes(profile.role));
}

const MODEL = /^[a-z0-9_.-]{1,40}$/i;

export async function GET(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "forbidden" }, { status: 403 });
  const model = new URL(request.url).searchParams.get("model") ?? "";
  if (!MODEL.test(model)) return Response.json({ error: "bad_model" }, { status: 400 });
  return Response.json(await pendingProductPhotos(model, 40), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "forbidden" }, { status: 403 });
  const body = (await request.json().catch(() => null)) as { model?: string; items?: { id?: string; url?: string; embedding?: unknown }[] } | null;
  if (!body?.model || !MODEL.test(body.model) || !Array.isArray(body.items)) return Response.json({ error: "bad_request" }, { status: 400 });

  const rows = body.items.slice(0, 50).flatMap((i) => {
    const v = parseEmbedding(i.embedding);
    return v && typeof i.id === "string" && /^[0-9a-f-]{36}$/i.test(i.id) && typeof i.url === "string"
      ? [{ product_id: i.id, embedding: toVector(v), image_url: indexKey(body.model!, i.url), updated_at: new Date().toISOString() }]
      : [];
  });
  if (rows.length === 0) return Response.json({ saved: 0 });
  const { error } = await createAdminClient().from("product_image_embeddings").upsert(rows);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ saved: rows.length });
}
