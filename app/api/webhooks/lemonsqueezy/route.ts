import { NextResponse } from "next/server";
import { verifyWebhook } from "@/lib/payments/lemonsqueezy";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Subscription lifecycle from Lemon Squeezy. Syncs plan into profiles.
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-signature");
  if (!verifyWebhook(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: {
    meta?: { event_name?: string; custom_data?: { user_id?: string } };
    data?: { attributes?: { status?: string; customer_id?: number }; id?: string };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload." }, { status: 400 });
  }

  const userId = event.meta?.custom_data?.user_id;
  const status = event.data?.attributes?.status;
  const customerId = event.data?.attributes?.customer_id;
  const subscriptionId = event.data?.id;
  if (!userId) return NextResponse.json({ received: true });

  // Active states grant Pro; everything else reverts to free.
  const active = status === "active" || status === "on_trial" || status === "paid";
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      plan: active ? "pro" : "free",
      plan_source: active ? "card" : null,
      plan_expires_at: null,
      ls_customer_id: customerId ? String(customerId) : null,
      ls_subscription_id: subscriptionId ?? null,
    })
    .eq("id", userId);

  return NextResponse.json({ received: true });
}
