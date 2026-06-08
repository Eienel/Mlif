"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react";

// Compact landing-page search. Hands off to the full results experience on /search.
export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex flex-col gap-2 rounded-card border border-hairline bg-surface p-2 shadow-warm-lg sm:flex-row sm:items-center sm:pl-4">
        <div className="flex flex-1 items-center gap-2.5">
          <MagnifyingGlass size={22} className="shrink-0 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="The one where a guy relives the same day..."
            aria-label="Describe a film from memory"
            className="h-12 w-full bg-transparent text-base text-ink outline-none placeholder:text-muted"
          />
        </div>
        <button
          type="submit"
          className="cursor-pointer rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Find it
        </button>
      </div>
    </form>
  );
}
