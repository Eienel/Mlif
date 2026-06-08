import { NextResponse } from "next/server";
import { verifyWebhook } from "@/lib/payments/coinbase";
import { createAdminClient } from "@/lib/supabase/admin";
import { cryptoExpiry } from "@/lib/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// USDC payment confirmations from Coinbase Commerce. A confirmed charge grants a
// 30-day Pro pass, extended from any time still left on an active pass.
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-cc-webhook-signature");
  if (!verifyWebhook(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let payload: {
    event?: { type?: string; data?: { metadata?: { user_id?: string } } };
  };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload." }, { status: 400 });
  }

  const type = payload.event?.type;
  const userId = payload.event?.data?.metadata?.user_id;
  if (!userId) return NextResponse.json({ received: true });

  // Grant only once payment is confirmed (or fully resolved).
  if (type === "charge:confirmed" || type === "charge:resolved") {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("plan, plan_source, plan_expires_at")
      .eq("id", userId)
      .maybeSingle();

    // Extend from the current expiry if a crypto pass is still active.
    let from = new Date();
    if (
      profile?.plan === "pro" &&
      profile.plan_source === "crypto" &&
      profile.plan_expires_at &&
      new Date(profile.plan_expires_at).getTime() > from.getTime()
    ) {
      from = new Date(profile.plan_expires_at);
    }

    await admin
      .from("profiles")
      .update({ plan: "pro", plan_source: "crypto", plan_expires_at: cryptoExpiry(from) })
      .eq("id", userId);
  }

  return NextResponse.json({ received: true });
}
