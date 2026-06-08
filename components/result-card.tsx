import Image from "next/image";
import Link from "next/link";
import { posterUrl } from "@/lib/tmdb";
import type { IdentifiedTitle } from "@/lib/types";
import { ConfidenceChip } from "@/components/confidence-chip";
import { WatchRows } from "@/components/watch-rows";
import { SaveButton } from "@/components/save-button";

// A single ranked result: poster, title, year, one-line reasoning, confidence,
// and the where-to-watch rows.
export function ResultCard({ result }: { result: IdentifiedTitle }) {
  const poster = posterUrl(result.posterPath, "w342");
  const href = `/title/${result.tmdbId}?type=${result.mediaType}`;
  const isSeries = result.mediaType === "tv";

  return (
    <article className="overflow-hidden rounded-card border border-hairline bg-surface shadow-warm">
      <div className="flex gap-4 p-4 sm:gap-5 sm:p-5">
        <Link
          href={href}
          className="relative aspect-[2/3] w-20 shrink-0 self-start overflow-hidden rounded-input bg-surface-2 sm:w-24"
        >
          {poster ? (
            <Image src={poster} alt={`${result.title} poster`} fill className="object-cover" sizes="96px" />
          ) : (
            <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted">
              No poster
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-xl font-semibold leading-tight text-ink">
                <Link href={href} className="hover:text-accent">
                  {result.title}
                </Link>
                {result.year ? <span className="ml-2 font-normal text-muted">{result.year}</span> : null}
                {isSeries ? (
                  <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 align-middle text-xs font-medium text-muted">
                    Series
                  </span>
                ) : null}
              </h3>
              {result.reasoning ? (
                <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted">
                  {result.reasoning}
                </p>
              ) : null}
            </div>
            <ConfidenceChip confidence={result.confidence} />
          </div>

          <div className="mt-4">
            <WatchRows watch={result.watch} />
          </div>

          <div className="mt-5 flex items-center gap-3">
            <Link
              href={href}
              className="text-sm font-medium text-accent underline-offset-2 hover:underline"
            >
              View details
            </Link>
            <SaveButton
              tmdbId={result.tmdbId}
              title={result.title}
              posterPath={result.posterPath}
              mediaType={result.mediaType}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
