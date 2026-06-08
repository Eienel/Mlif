import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCharge, coinbaseConfigured } from "@/lib/payments/coinbase";

export const runtime = "nodejs";

// Starts a USDC (crypto) charge for a 30-day Pro pass via Coinbase Commerce.
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  if (!coinbaseConfigured()) {
    return NextResponse.json({ error: "Crypto billing not configured." }, { status: 500 });
  }

  const url = await createCharge(user.id, user.email ?? "");
  if (!url) return NextResponse.json({ error: "Could not start crypto checkout." }, { status: 502 });
  return NextResponse.json({ url });
}
