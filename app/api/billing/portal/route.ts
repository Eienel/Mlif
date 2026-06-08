import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomerPortalUrl } from "@/lib/payments/lemonsqueezy";

export const runtime = "nodejs";

// Opens the Lemon Squeezy customer portal so a card subscriber can manage or cancel.
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("ls_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.ls_customer_id) {
    return NextResponse.json({ error: "No card subscription to manage." }, { status: 400 });
  }

  const url = await getCustomerPortalUrl(String(profile.ls_customer_id));
  if (!url) return NextResponse.json({ error: "Could not open billing portal." }, { status: 502 });
  return NextResponse.json({ url });
}
