"use client";

import { useState } from "react";
import { Check } from "@phosphor-icons/react";
import { FREE_DAILY_LIMIT } from "@/lib/usage";

// Clean monthly price. Editable in one place.
const PRO_PRICE = 5;

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

export function Pricing() {
  const [pending, setPending] = useState(false);

  async function upgrade() {
    setPending(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (res.status === 401) {
        window.location.href = "/login?next=/account";
        return;
      }
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setPending(false);
    }
  }

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-5 py-20">
      <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Simple pricing.
      </h2>
      <p className="mt-2 max-w-md text-muted">
        Try it free. Go Pro when you want unlimited finds and a watchlist.
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
          <button
            type="button"
            onClick={upgrade}
            disabled={pending}
            className="mt-8 w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Opening checkout..." : "Go Pro"}
          </button>
        </div>
      </div>
    </section>
  );
}
