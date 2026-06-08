import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Exchanges the auth code for a session, then ensures a profiles row exists.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // Create the profile row on first sign-in.
      try {
        const admin = createAdminClient();
        await admin
          .from("profiles")
          .upsert({ id: data.user.id, email: data.user.email }, { onConflict: "id", ignoreDuplicates: true });
      } catch {
        // Profile creation is also covered by a DB trigger; ignore if it fails here.
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
