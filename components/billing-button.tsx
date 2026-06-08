"use client";

import { useState } from "react";

// Routes Pro users to the Stripe portal and free users to checkout.
export function BillingButton({ isPro }: { isPro: boolean }) {
  const [pending, setPending] = useState(false);

  async function go() {
    setPending(true);
    try {
      const endpoint = isPro ? "/api/stripe/portal" : "/api/stripe/checkout";
      const res = await fetch(endpoint, { method: "POST" });
      const data = (await res.json()) as { url?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={go}
      disabled={pending}
      className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Opening..." : isPro ? "Manage billing" : "Go Pro"}
    </button>
  );
}
