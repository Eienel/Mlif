"use client";

import { useRouter } from "next/navigation";

// Real, film-literate example queries the user can tap to run.
const EXAMPLES = [
  "A hitman in a sharp suit who loves his dog",
  "Toys that come alive when the kid leaves the room",
  "A bus that explodes if it drops below fifty miles per hour",
  "A heist crew steals through people's dreams",
  "Talking sea creatures, a forgetful blue fish",
  "Two phone-booth slackers travel through time for a history report",
];

export function ExampleQueries() {
  const router = useRouter();
  return (
    <div className="flex flex-wrap gap-2.5">
      {EXAMPLES.map((q) => (
        <button
          key={q}
          type="button"
          onClick={() => router.push(`/search?q=${encodeURIComponent(q)}`)}
          className="rounded-full border border-hairline bg-surface px-4 py-2 text-left text-sm text-ink transition-shadow hover:shadow-warm"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
