// Plan gating and the daily free-identification limit. Enforced server-side.
// Per-user counter for signed-in users, per-IP for anonymous visitors.

import { createAdminClient } from "@/lib/supabase/admin";

export const FREE_DAILY_LIMIT = 5;

export interface UsageState {
  plan: "free" | "pro";
  used: number;
  limit: number;
  allowed: boolean;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Consume one identification for a signed-in user, resetting the counter daily.
// Returns whether the call is allowed and the current usage snapshot.
export async function consumeForUser(userId: string): Promise<UsageState> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("plan, daily_searches, daily_reset_at")
    .eq("id", userId)
    .maybeSingle();

  const plan = (profile?.plan as "free" | "pro") ?? "free";
  if (plan === "pro") {
    return { plan, used: 0, limit: Infinity, allowed: true };
  }

  // Reset the counter if the stored reset date is not today.
  let used = profile?.daily_searches ?? 0;
  if (!profile || profile.daily_reset_at !== today()) {
    used = 0;
  }

  if (used >= FREE_DAILY_LIMIT) {
    return { plan, used, limit: FREE_DAILY_LIMIT, allowed: false };
  }

  await admin
    .from("profiles")
    .update({ daily_searches: used + 1, daily_reset_at: today() })
    .eq("id", userId);

  return { plan, used: used + 1, limit: FREE_DAILY_LIMIT, allowed: true };
}

// Anonymous visitors are limited per IP via the same daily window. We store
// the counter in provider_cache-adjacent table `anon_usage`. Best effort: if
// Supabase is not configured the call is allowed (local dev).
export async function consumeForAnon(ip: string): Promise<UsageState> {
  try {
    const admin = createAdminClient();
    const key = `${ip}:${today()}`;
    const { data } = await admin
      .from("anon_usage")
      .select("count")
      .eq("key", key)
      .maybeSingle();

    const used = data?.count ?? 0;
    if (used >= FREE_DAILY_LIMIT) {
      return { plan: "free", used, limit: FREE_DAILY_LIMIT, allowed: false };
    }
    await admin.from("anon_usage").upsert({ key, count: used + 1 });
    return { plan: "free", used: used + 1, limit: FREE_DAILY_LIMIT, allowed: true };
  } catch {
    return { plan: "free", used: 0, limit: FREE_DAILY_LIMIT, allowed: true };
  }
}
