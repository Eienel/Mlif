"use client";

import { useEffect, useState } from "react";
import { BookmarkSimple } from "@phosphor-icons/react";
import { isSaved, toggleSaved, subscribe } from "@/lib/watchlist-local";

interface SaveButtonProps {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  mediaType?: "movie" | "tv";
}

// Saving is instant and local to the browser. No account, no network.
export function SaveButton({ tmdbId, title, posterPath, mediaType = "movie" }: SaveButtonProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isSaved(tmdbId));
    return subscribe(() => setSaved(isSaved(tmdbId)));
  }, [tmdbId]);

  function toggle() {
    setSaved(toggleSaved({ tmdbId, mediaType, title, posterPath }));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
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
