"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellRinging, Trash } from "@phosphor-icons/react";
import { posterUrl } from "@/lib/tmdb";

interface WatchlistItemProps {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  notifyWhenFree: boolean;
}

export function WatchlistItem({ tmdbId, title, posterPath, notifyWhenFree }: WatchlistItemProps) {
  const router = useRouter();
  const [notify, setNotify] = useState(notifyWhenFree);
  const [removed, setRemoved] = useState(false);
  const poster = posterUrl(posterPath, "w185");

  async function toggleNotify() {
    const next = !notify;
    setNotify(next);
    await fetch("/api/watchlist", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tmdbId, notifyWhenFree: next }),
    });
  }

  async function remove() {
    setRemoved(true);
    await fetch("/api/watchlist", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tmdbId }),
    });
    router.refresh();
  }

  if (removed) return null;

  return (
    <div className="flex items-center gap-4 rounded-card border border-hairline bg-surface p-4 shadow-warm">
      <Link href={`/title/${tmdbId}`} className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-input bg-surface-2">
        {poster ? <Image src={poster} alt={title} fill className="object-cover" sizes="56px" /> : null}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/title/${tmdbId}`} className="font-display text-lg font-semibold text-ink hover:text-accent">
          {title}
        </Link>
      </div>
      <button
        type="button"
        onClick={toggleNotify}
        aria-pressed={notify}
        title="Notify me when this hits a free platform"
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
          notify ? "border-accent bg-accent text-white" : "border-hairline bg-surface text-muted hover:text-ink"
        }`}
      >
        <BellRinging size={16} weight={notify ? "fill" : "regular"} />
        <span className="hidden sm:inline">{notify ? "Alerting" : "Alert me"}</span>
      </button>
      <button
        type="button"
        onClick={remove}
        title="Remove"
        className="rounded-full border border-hairline bg-surface p-2 text-muted transition-colors hover:text-accent"
      >
        <Trash size={16} />
      </button>
    </div>
  );
}
