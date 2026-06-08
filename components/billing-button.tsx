"use client";

import { useState } from "react";

interface BillingButtonProps {
  isPro: boolean;
  // Crypto Pro passes renew manually; card subs open the portal.
  isCrypto?: boolean;
}

export function BillingButton({ isPro, isCrypto = false }: BillingButtonProps) {
  const [pending, setPending] = useState(false);

  async function go() {
    // Free users head to the pricing section to pick a rail.
    if (!isPro) {
      window.location.href = "/#pricing";
      return;
    }
    setPending(true);
    try {
      const endpoint = isCrypto ? "/api/billing/crypto" : "/api/billing/portal";
      const res = await fetch(endpoint, { method: "POST" });
      const data = (await res.json()) as { url?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setPending(false);
    }
  }

  const label = !isPro ? "See plans" : isCrypto ? "Renew USDC pass" : "Manage billing";

  return (
    <button
      type="button"
      onClick={go}
      disabled={pending}
      className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Opening..." : label}
    </button>
  );
}
