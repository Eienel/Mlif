"use client";

import { useState } from "react";
import { Check, CreditCard, CurrencyDollarSimple } from "@phosphor-icons/react";
import { FREE_DAILY_LIMIT } from "@/lib/usage";

// Clean monthly price. Editable in one place; mirror it in NEXT_PUBLIC_PRO_PRICE.
const PRO_PRICE = process.env.NEXT_PUBLIC_PRO_PRICE ?? "5";

const FREE_FEATURES = [
  `${FREE_DAILY_LIMIT} identifications a day`,
  "Full where-to-watch, every region",
  "Free ad-supported sources included",
];

const PRO_FEATURES = [
  "Unlimited identifications",
  "Save a watchlist",
  "Alerts when a title hits a free platform",
  "Faster, higher-quality model",
];

type Rail = "card" | "crypto";

export function Pricing() {
  const [pending, setPending] = useState<Rail | null>(null);

  async function start(rail: Rail) {
    setPending(rail);
    try {
      const endpoint = rail === "card" ? "/api/billing/checkout" : "/api/billing/crypto";
      const res = await fetch(endpoint, { method: "POST" });
      if (res.status === 401) {
        window.location.href = "/login?next=/account";
        return;
      }
      const data = (await res.json()) as { url?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setPending(null);
    }
  }

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-5 py-20">
      <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Simple pricing.
      </h2>
      <p className="mt-2 max-w-md text-muted">
        Try it free. Go Pro by card from anywhere, or pay with USDC.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <div className="rounded-card border border-hairline bg-surface p-8 shadow-warm">
          <p className="text-sm font-medium uppercase tracking-wide text-muted">Free</p>
          <p className="mt-3 font-display text-4xl font-semibold text-ink">
            $0<span className="text-lg font-normal text-muted"> / month</span>
          </p>
          <ul className="mt-6 space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-ink">
                <Check size={18} className="mt-0.5 shrink-0 text-accent" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative rounded-card border-2 border-accent bg-surface p-8 shadow-warm-lg">
          <span className="absolute -top-3 left-8 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
            Most popular
          </span>
          <p className="text-sm font-medium uppercase tracking-wide text-accent">Pro</p>
          <p className="mt-3 font-display text-4xl font-semibold text-ink">
            ${PRO_PRICE}
            <span className="text-lg font-normal text-muted"> / month</span>
          </p>
          <ul className="mt-6 space-y-3">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-ink">
                <Check size={18} className="mt-0.5 shrink-0 text-accent" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 space-y-2.5">
            <button
              type="button"
              onClick={() => start("card")}
              disabled={pending !== null}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <CreditCard size={18} />
              {pending === "card" ? "Opening checkout..." : "Pay with card"}
            </button>
            <button
              type="button"
              onClick={() => start("crypto")}
              disabled={pending !== null}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-hairline bg-surface px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-accent disabled:opacity-60"
            >
              <CurrencyDollarSimple size={18} />
              {pending === "crypto" ? "Opening..." : "Pay with USDC"}
            </button>
            <p className="pt-1 text-center text-xs text-muted">
              Card billing recurs monthly. USDC buys a 30-day pass.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
