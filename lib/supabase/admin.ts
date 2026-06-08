import { createClient } from "@supabase/supabase-js";

// Service-role client. Server only. Bypasses RLS for provider-cache writes and
// the per-IP fair-use counter. Never import this into client code.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
