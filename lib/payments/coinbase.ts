// Coinbase Commerce client. Server only. Accepts USDC (and other crypto) as a
// fixed-price Pro pass. Crypto cannot truly auto-recur, so each payment grants
// a 30-day window that the user renews manually.

import crypto from "crypto";

const CB_BASE = "https://api.commerce.coinbase.com";

export function coinbaseConfigured(): boolean {
  return Boolean(process.env.COINBASE_COMMERCE_API_KEY);
}

// Clean monthly price for the USDC pass, kept in sync with the card price.
export const PRO_PRICE_USD = process.env.NEXT_PUBLIC_PRO_PRICE ?? "5";

// Creates a hosted charge. The Supabase user id rides in metadata so the
// webhook can grant the pass to the right account.
export async function createCharge(userId: string, email: string): Promise<string | null> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const body = {
    name: "Premise Pro",
    description: "30 days of unlimited identifications and watchlist.",
    pricing_type: "fixed_price",
    local_price: { amount: PRO_PRICE_USD, currency: "USD" },
    metadata: { user_id: userId, email },
    redirect_url: `${siteUrl}/account?checkout=success`,
    cancel_url: `${siteUrl}/#pricing`,
  };

  const res = await fetch(`${CB_BASE}/charges`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CC-Api-Key": process.env.COINBASE_COMMERCE_API_KEY!,
      "X-CC-Version": "2018-03-22",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: { hosted_url?: string } };
  return json.data?.hosted_url ?? null;
}

// Verifies the X-CC-Webhook-Signature header (HMAC-SHA256 of the raw body).
export function verifyWebhook(rawBody: string, signature: string | null): boolean {
  const secret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}
