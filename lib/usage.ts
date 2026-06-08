// Fair-use daily cap. Premise is free, so this is not a paywall: it only keeps
// one visitor from burning the shared free API quotas (Gemini, TMDB, Watchmode).
// Per-user counter for signed-in users, per-IP for anonymous visitors.

import { createAdminClient } from "@/lib/supabase/admin";

// Generous daily cap. Plenty for real use; trips only on abuse.
export const DAILY_LIMIT = 40;

export interface UsageState {
  used: number;
  limit: number;
  allowed: boolean;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Visitors are capped per IP via a daily window. Best effort: if Supabase is not
// configured the call is allowed (so the app works with TMDB + Gemini alone).
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
    if (used >= DAILY_LIMIT) {
      return { used, limit: DAILY_LIMIT, allowed: false };
    }
    await admin.from("anon_usage").upsert({ key, count: used + 1 });
    return { used: used + 1, limit: DAILY_LIMIT, allowed: true };
  } catch {
    return { used: 0, limit: DAILY_LIMIT, allowed: true };
  }
}
