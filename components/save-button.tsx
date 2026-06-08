"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookmarkSimple } from "@phosphor-icons/react";

interface SaveButtonProps {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  // Whether the viewer is signed in. Anonymous users are routed to login.
  authed: boolean;
  initialSaved?: boolean;
}

// Saving the watchlist is a Pro feature, gated server-side by /api/watchlist.
export function SaveButton({ tmdbId, title, posterPath, authed, initialSaved = false }: SaveButtonProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (!authed) {
      router.push("/login?next=/watchlist");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/watchlist", {
        method: saved ? "DELETE" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tmdbId, title, posterPath }),
      });
      if (res.status === 402) {
        router.push("/#pricing");
        return;
      }
      if (res.ok) setSaved((s) => !s);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
        saved
          ? "border-accent bg-accent text-white"
          : "border-hairline bg-surface text-ink hover:border-accent"
      }`}
    >
      <BookmarkSimple size={16} weight={saved ? "fill" : "regular"} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
