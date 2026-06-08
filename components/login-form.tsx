"use client";

import { useState } from "react";
import { GoogleLogo, EnvelopeSimple } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

// Email magic link plus Google OAuth. No passwords.
export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");
  const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }

  if (status === "sent") {
    return (
      <div className="rounded-card border border-hairline bg-surface p-8 text-center shadow-warm">
        <EnvelopeSimple size={28} className="mx-auto text-accent" />
        <p className="mt-3 font-display text-xl text-ink">Check your inbox</p>
        <p className="mt-1 text-muted">We sent a sign-in link to {email}.</p>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-hairline bg-surface p-7 shadow-warm">
      <button
        type="button"
        onClick={signInWithGoogle}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-hairline bg-surface px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-accent"
      >
        <GoogleLogo size={18} weight="bold" />
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-[var(--color-hairline)]" />
        or
        <span className="h-px flex-1 bg-[var(--color-hairline)]" />
      </div>

      <form onSubmit={sendMagicLink} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-input border border-hairline bg-surface-2 px-4 py-3 text-ink outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {status === "sending" ? "Sending..." : "Email me a sign-in link"}
        </button>
        {status === "error" ? <p className="text-sm text-accent">{message}</p> : null}
      </form>
    </div>
  );
}
