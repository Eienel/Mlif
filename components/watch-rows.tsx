import Image from "next/image";
import type { WatchData, WatchOption } from "@/lib/types";

function ProviderPill({ option }: { option: WatchOption }) {
  const showPrice = (option.type === "rent" || option.type === "buy") && option.price != null;
  return (
    <a
      href={option.link || "#"}
      target="_blank"
      rel="noreferrer"
      className="group inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-2.5 py-1.5 text-sm text-ink transition-shadow hover:shadow-warm"
    >
      {option.logoUrl ? (
        <Image
          src={option.logoUrl}
          alt=""
          width={22}
          height={22}
          className="h-5 w-5 rounded-[5px] object-cover"
          unoptimized
        />
      ) : null}
      <span className="font-medium">{option.providerName}</span>
      {showPrice ? (
        <span className="text-muted">${option.price!.toFixed(2)}</span>
      ) : null}
    </a>
  );
}

function Row({
  label,
  hint,
  options,
}: {
  label: string;
  hint?: string;
  options: WatchOption[];
}) {
  if (!options.length) return null;
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <ProviderPill key={`${o.type}-${o.providerName}`} option={o} />
        ))}
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
      <Row label="Watch free with ads" hint="legal, ad-supported" options={watch.free} />
      <Row label="Stream with subscription" options={watch.flatrate} />
      <Row label="Rent" options={watch.rent} />
      <Row label="Buy" options={watch.buy} />
    </div>
  );
}
