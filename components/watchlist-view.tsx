"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookmarkSimple, Trash } from "@phosphor-icons/react";
import { posterUrl } from "@/lib/tmdb";
import { getWatchlist, removeSaved, subscribe, type SavedTitle } from "@/lib/watchlist-local";

// The whole watchlist is read from the browser, so it needs no account and
// renders client-side. Hydration starts empty, then fills from localStorage.
export function WatchlistView() {
  const [items, setItems] = useState<SavedTitle[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = () => {
      setItems(getWatchlist());
      setReady(true);
    };
    load();
    return subscribe(load);
  }, []);

  if (!ready) {
    return <div className="mt-8 h-24 animate-pulse rounded-card bg-surface-2" />;
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 rounded-card border border-hairline bg-surface p-8 text-center shadow-warm">
        <BookmarkSimple size={28} className="mx-auto text-muted" />
        <p className="mt-3 font-display text-xl text-ink">Nothing saved yet</p>
        <p className="mt-1 text-muted">Identify a film, then tap Save to keep it here.</p>
        <Link
          href="/search"
          className="mt-5 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white"
        >
          Find a film
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-3">
      {items.map((it) => {
        const poster = posterUrl(it.posterPath, "w185");
        return (
          <div
            key={it.tmdbId}
            className="flex items-center gap-4 rounded-card border border-hairline bg-surface p-4 shadow-warm"
          >
            <Link
              href={`/title/${it.tmdbId}?type=${it.mediaType ?? "movie"}`}
              className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-input bg-surface-2"
            >
              {poster ? (
                <Image src={poster} alt={it.title} fill className="object-cover" sizes="56px" />
              ) : null}
            </Link>
            <Link
              href={`/title/${it.tmdbId}?type=${it.mediaType ?? "movie"}`}
              className="min-w-0 flex-1 font-display text-lg font-semibold text-ink hover:text-accent"
            >
              {it.title}
            </Link>
            <button
              type="button"
              onClick={() => removeSaved(it.tmdbId)}
              title="Remove"
              className="rounded-full border border-hairline bg-surface p-2 text-muted transition-colors hover:text-accent"
            >
              <Trash size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
