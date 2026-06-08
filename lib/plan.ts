// Central plan logic. Pro can come from a card subscription (no expiry, managed
// by the Lemon Squeezy webhook lifecycle) or a USDC crypto pass (30-day expiry).

export interface PlanRow {
  plan?: string | null;
  plan_expires_at?: string | null;
}

// True when the profile currently has active Pro access.
export function isProActive(profile: PlanRow | null | undefined): boolean {
  if (!profile || profile.plan !== "pro") return false;
  // Card subscriptions have no expiry; crypto passes do.
  if (!profile.plan_expires_at) return true;
  return new Date(profile.plan_expires_at).getTime() > Date.now();
}

// Days of crypto Pro access granted per USDC payment.
export const CRYPTO_PASS_DAYS = 30;

export function cryptoExpiry(from: Date = new Date()): string {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + CRYPTO_PASS_DAYS);
  return d.toISOString();
}
