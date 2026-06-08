// Lemon Squeezy client. Server only. Worldwide card and PayPal payments with
// real recurring subscriptions, merchant of record (handles global tax and
// pays out internationally, which is why it fits a Nigeria-based merchant).
//
// We talk to the REST API directly with fetch, so there is no extra SDK.

import crypto from "crypto";

const LS_BASE = "https://api.lemonsqueezy.com/v1";

function headers(): HeadersInit {
  return {
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
    Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
  };
}

export function lemonSqueezyConfigured(): boolean {
  return Boolean(
    process.env.LEMONSQUEEZY_API_KEY &&
      process.env.LEMONSQUEEZY_STORE_ID &&
      process.env.LEMONSQUEEZY_VARIANT_ID,
  );
}

// Creates a hosted checkout for the Pro subscription. We pass the Supabase user
// id and email so the webhook can map the resulting subscription back to a row.
export async function createCheckout(userId: string, email: string): Promise<string | null> {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID!;
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID!;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const body = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email,
          custom: { user_id: userId },
        },
        product_options: {
          redirect_url: `${siteUrl}/account?checkout=success`,
        },
      },
      relationships: {
        store: { data: { type: "stores", id: String(storeId) } },
        variant: { data: { type: "variants", id: String(variantId) } },
      },
    },
  };

  const res = await fetch(`${LS_BASE}/checkouts`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: { attributes?: { url?: string } } };
  return json.data?.attributes?.url ?? null;
}

// Returns the customer portal URL so a subscriber can manage or cancel.
export async function getCustomerPortalUrl(customerId: string): Promise<string | null> {
  const res = await fetch(`${LS_BASE}/customers/${customerId}`, { headers: headers() });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    data?: { attributes?: { urls?: { customer_portal?: string } } };
  };
  return json.data?.attributes?.urls?.customer_portal ?? null;
}

// Verifies the X-Signature header (HMAC-SHA256 of the raw body).
export function verifyWebhook(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}
