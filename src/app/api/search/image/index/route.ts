import { createClient } from "@/lib/supabase/server";
import { indexProductPhotos } from "@/lib/visual-search";

// POST /api/search/image/index — admin only. Indexes the next batch of
// product photos for camera search; the admin page calls it until
// `remaining` is 0.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "super_admin"].includes(profile.role)) return Response.json({ error: "forbidden" }, { status: 403 });

  try {
    return Response.json(await indexProductPhotos({ limit: 25 }));
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "failed" }, { status: 500 });
  }
}
