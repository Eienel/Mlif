import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WatchRows } from "@/components/watch-rows";
import { SaveButton } from "@/components/save-button";
import { getMediaDetail, getSimilar, posterUrl, TMDB_IMAGE_BASE } from "@/lib/tmdb";
import { getWatchData } from "@/lib/watch";
import { isSupportedCountry, DEFAULT_COUNTRY, COUNTRIES } from "@/lib/countries";
import type { MediaType } from "@/lib/types";

interface PageProps {
  params: { tmdbId: string };
  searchParams: { country?: string; type?: string };
}

function mediaTypeFrom(type?: string): MediaType {
  return type === "tv" ? "tv" : "movie";
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const detail = await getMediaDetail(Number(params.tmdbId), mediaTypeFrom(searchParams.type));
  if (!detail) return { title: "Title not found" };
  return { title: detail.title, description: detail.overview.slice(0, 160) };
}

export default async function TitlePage({ params, searchParams }: PageProps) {
  const tmdbId = Number(params.tmdbId);
  if (!Number.isFinite(tmdbId)) notFound();

  const mediaType = mediaTypeFrom(searchParams.type);
  const country =
    searchParams.country && isSupportedCountry(searchParams.country)
      ? searchParams.country.toUpperCase()
      : DEFAULT_COUNTRY;

  const [detail, similar] = await Promise.all([
    getMediaDetail(tmdbId, mediaType),
    getSimilar(tmdbId, mediaType),
  ]);
  if (!detail) notFound();

  const watch = await getWatchData(tmdbId, country, mediaType);

  const poster = posterUrl(detail.poster_path, "w500");
  const backdrop = detail.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${detail.backdrop_path}` : null;
  const cast = detail.cast;
  const isSeries = mediaType === "tv";

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      {backdrop ? (
        <div className="relative h-48 w-full overflow-hidden sm:h-64">
          <Image src={backdrop} alt="" fill className="object-cover" sizes="100vw" priority />
          <div className="absolute inset-0 bg-bg/55" />
        </div>
      ) : null}

      <main className="mx-auto max-w-5xl px-5 pb-16">
        <div className={`grid gap-8 sm:grid-cols-[200px_1fr] ${backdrop ? "-mt-24" : "pt-10"}`}>
          <div className="relative mx-auto aspect-[2/3] w-44 overflow-hidden rounded-card border border-hairline bg-surface-2 shadow-warm-lg sm:mx-0 sm:w-full">
            {poster ? (
              <Image src={poster} alt={`${detail.title} poster`} fill className="object-cover" sizes="200px" priority />
            ) : null}
          </div>

          <div className="pt-2">
            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-ink">
              {detail.title}
              {detail.year ? <span className="ml-3 font-normal text-muted">{detail.year}</span> : null}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
              {isSeries ? (
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium">Series</span>
              ) : null}
              {isSeries && detail.seasons ? (
                <span>{detail.seasons} season{detail.seasons > 1 ? "s" : ""}</span>
              ) : null}
              {detail.runtime ? <span>{detail.runtime} min{isSeries ? " / ep" : ""}</span> : null}
              {detail.genres.length ? <span>{detail.genres.map((g) => g.name).join(", ")}</span> : null}
              {detail.voteAverage ? <span>{detail.voteAverage.toFixed(1)} / 10</span> : null}
            </div>
            {detail.overview ? (
              <p className="mt-4 max-w-prose leading-relaxed text-ink">{detail.overview}</p>
            ) : null}
            <div className="mt-5">
              <SaveButton tmdbId={tmdbId} title={detail.title} posterPath={detail.poster_path} mediaType={mediaType} />
            </div>
          </div>
        </div>

        {/* Where to watch, by country. */}
        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">Where to watch</h2>
            <CountryLinks tmdbId={tmdbId} mediaType={mediaType} current={country} />
          </div>
          <div className="mt-5 rounded-card border border-hairline bg-surface p-6 shadow-warm">
            <WatchRows watch={watch} />
          </div>
        </section>

        {/* Cast. */}
        {cast.length ? (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">Cast</h2>
            <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
              {cast.map((c) => (
                <div key={c.id} className="w-24 shrink-0 text-center">
                  <div className="relative mx-auto aspect-[2/3] w-24 overflow-hidden rounded-input bg-surface-2">
                    {c.profile_path ? (
                      <Image
                        src={`${TMDB_IMAGE_BASE}/w185${c.profile_path}`}
                        alt={c.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs font-medium text-ink">{c.name}</p>
                  {c.character ? <p className="text-xs text-muted">{c.character}</p> : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* More like this. */}
        {similar.length ? (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">More like this</h2>
            <div className="mt-5 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
              {similar.slice(0, 12).map((m) => {
                const p = posterUrl(m.poster_path, "w342");
                return (
                  <Link key={m.id} href={`/title/${m.id}?type=${m.mediaType}`} className="group">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-input bg-surface-2 shadow-warm">
                      {p ? (
                        <Image src={p} alt={m.title} fill className="object-cover transition-transform group-hover:scale-105" sizes="160px" />
                      ) : null}
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-ink">{m.title}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}

// Country switcher rendered as plain links so the page stays a Server Component.
function CountryLinks({ tmdbId, mediaType, current }: { tmdbId: number; mediaType: MediaType; current: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COUNTRIES.map((c) => (
        <Link
          key={c.code}
          href={`/title/${tmdbId}?type=${mediaType}&country=${c.code}`}
          scroll={false}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            c.code === current ? "bg-accent text-white" : "bg-surface-2 text-ink hover:text-accent"
          }`}
        >
          {c.code}
        </Link>
      ))}
    </div>
  );
}
