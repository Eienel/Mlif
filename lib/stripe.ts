import Stripe from "stripe";

// Stripe client. Server only.
let stripeClient: Stripe | null = null;
export function getStripe(): Stripe {
  if (!stripeClient) {
    // Omit apiVersion so the SDK pins to the version it ships with.
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripeClient;
}
