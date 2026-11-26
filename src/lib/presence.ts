import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Who is on the site right now. Open tabs ping /api/presence every minute
// while visible; the last ping is kept in the rate_limits table (key
// "seen:<user id>"), so no extra table is needed.

const ONLINE_FOR_MS = 3 * 60_000;

export async function markSeen(userId: string) {
  await createAdminClient()
    .from("rate_limits")
    .upsert({ key: `seen:${userId}`, window_start: new Date().toISOString(), hits: 0 });
}

/** The subset of `userIds` with no visible tab in the last 3 minutes. */
export async function offlineUsers(userIds: string[]): Promise<Set<string>> {
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return new Set();
  const { data } = await createAdminClient()
    .from("rate_limits")
    .select("key, window_start")
    .in("key", ids.map((id) => `seen:${id}`));
  const online = new Set(
    (data ?? [])
      .filter((r) => Date.now() - new Date(r.window_start).getTime() < ONLINE_FOR_MS)
      .map((r) => r.key.slice(5))
  );
  return new Set(ids.filter((id) => !online.has(id)));
}
