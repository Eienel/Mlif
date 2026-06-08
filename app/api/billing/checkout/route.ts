import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckout, lemonSqueezyConfigured } from "@/lib/payments/lemonsqueezy";

export const runtime = "nodejs";

// Starts a worldwide card/PayPal checkout for the Pro subscription via Lemon Squeezy.
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  if (!lemonSqueezyConfigured()) {
    return NextResponse.json({ error: "Card billing not configured." }, { status: 500 });
  }

  const url = await createCheckout(user.id, user.email ?? "");
  if (!url) return NextResponse.json({ error: "Could not start checkout." }, { status: 502 });
  return NextResponse.json({ url });
}
