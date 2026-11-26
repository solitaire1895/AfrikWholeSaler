import { createClient } from "@/lib/supabase/server";
import { markSeen } from "@/lib/presence";

/** Heartbeat from an open, visible tab: the user counts as on the site. */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await markSeen(user.id);
  return new Response(null, { status: 204 });
}
