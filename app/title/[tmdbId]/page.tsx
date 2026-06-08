import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WatchRows } from "@/components/watch-rows";
import { SaveButton } from "@/components/save-button";
import { getMovieDetail, getSimilar, posterUrl, yearFrom, TMDB_IMAGE_BASE } from "@/lib/tmdb";
import { getWatchData } from "@/lib/watch";
import { isSupportedCountry, DEFAULT_COUNTRY, COUNTRIES } from "@/lib/countries";

interface PageProps {
  params: { tmdbId: string };
  searchParams: { country?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const movie = await getMovieDetail(Number(params.tmdbId));
  if (!movie) return { title: "Title not found" };
  return { title: movie.title, description: movie.overview?.slice(0, 160) };
}

export default async function TitlePage({ params, searchParams }: PageProps) {
  const tmdbId = Number(params.tmdbId);
  if (!Number.isFinite(tmdbId)) notFound();

  const country = searchParams.country && isSupportedCountry(searchParams.country)
    ? searchParams.country.toUpperCase()
    : DEFAULT_COUNTRY;

  const [movie, similar] = await Promise.all([getMovieDetail(tmdbId), getSimilar(tmdbId)]);
  if (!movie) notFound();

  const watch = await getWatchData(tmdbId, country);

  const poster = posterUrl(movie.poster_path, "w500");
  const backdrop = movie.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${movie.backdrop_path}` : null;
  const year = yearFrom(movie.release_date);
  const cast = movie.credits?.cast?.slice(0, 8) ?? [];

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
              <Image src={poster} alt={`${movie.title} poster`} fill className="object-cover" sizes="200px" priority />
            ) : null}
          </div>

          <div className="pt-2">
            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-ink">
              {movie.title}
              {year ? <span className="ml-3 font-normal text-muted">{year}</span> : null}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
              {movie.runtime ? <span>{movie.runtime} min</span> : null}
              {movie.genres?.length ? (
                <span>{movie.genres.map((g) => g.name).join(", ")}</span>
              ) : null}
              {movie.vote_average ? <span>{movie.vote_average.toFixed(1)} / 10</span> : null}
            </div>
            {movie.overview ? (
              <p className="mt-4 max-w-prose leading-relaxed text-ink">{movie.overview}</p>
            ) : null}
            <div className="mt-5">
              <SaveButton
                tmdbId={tmdbId}
                title={movie.title}
                posterPath={movie.poster_path ?? null}
              />
            </div>
          </div>
        </div>

        {/* Where to watch, by country. */}
        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
              Where to watch
            </h2>
            <CountryLinks tmdbId={tmdbId} current={country} />
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
                  <Link key={m.id} href={`/title/${m.id}`} className="group">
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
function CountryLinks({ tmdbId, current }: { tmdbId: number; current: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COUNTRIES.slice(0, 6).map((c) => (
        <Link
          key={c.code}
          href={`/title/${tmdbId}?country=${c.code}`}
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
