import type { WatchData, WatchOption } from "@/lib/types";
import { ProviderLogo } from "@/components/provider-logo";

function ProviderPill({ option }: { option: WatchOption }) {
  const showPrice = (option.type === "rent" || option.type === "buy") && option.price != null;
  return (
    <a
      href={option.link || "#"}
      target="_blank"
      rel="noreferrer"
      className="group inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-2.5 py-1.5 text-sm text-ink transition-shadow hover:shadow-warm"
    >
      <ProviderLogo src={option.logoUrl} alt="" />
      <span className="font-medium">{option.providerName}</span>
      {showPrice ? (
        <span className="text-muted">${option.price!.toFixed(2)}</span>
      ) : null}
    </a>
  );
}

// Keep rows tidy: surface the main providers, hide a long tail behind a link to
// the full TMDB watch page for that title.
const MAX_VISIBLE = 8;

function Row({
  label,
  hint,
  options,
  morePage,
}: {
  label: string;
  hint?: string;
  options: WatchOption[];
  morePage?: string | null;
}) {
  if (!options.length) return null;
  const visible = options.slice(0, MAX_VISIBLE);
  const hidden = options.length - visible.length;
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {visible.map((o) => (
          <ProviderPill key={`${o.type}-${o.providerName}`} option={o} />
        ))}
        {hidden > 0 && morePage ? (
          <a
            href={morePage}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full border border-hairline bg-surface-2 px-2.5 py-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            +{hidden} more
          </a>
        ) : null}
      </div>
    </div>
  );
}

// Where-to-watch, grouped into clear rows. Only legal providers ever appear.
export function WatchRows({ watch }: { watch: WatchData | null }) {
  if (!watch) {
    return (
      <p className="text-sm text-muted">Checking where this is available...</p>
    );
  }

  const hasAny =
    watch.flatrate.length || watch.free.length || watch.rent.length || watch.buy.length;

  if (!hasAny) {
    return (
      <div className="rounded-input bg-surface-2 px-4 py-3 text-sm text-muted">
        No legal streaming source in {watch.country} right now.
        {watch.tmdbWatchPage ? (
          <>
            {" "}
            <a
              href={watch.tmdbWatchPage}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-accent underline-offset-2 hover:underline"
            >
              Check other regions
            </a>
            .
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Row label="Watch free with ads" hint="legal, ad-supported" options={watch.free} morePage={watch.tmdbWatchPage} />
      <Row label="Stream with subscription" options={watch.flatrate} morePage={watch.tmdbWatchPage} />
      <Row label="Rent" options={watch.rent} morePage={watch.tmdbWatchPage} />
      <Row label="Buy" options={watch.buy} morePage={watch.tmdbWatchPage} />
    </div>
  );
}
