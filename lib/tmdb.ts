// TMDB client. Server only. Catalog, search, posters, overviews, and the
// JustWatch-powered /watch/providers endpoint. Supports both movies and TV.

import type { MediaType } from "@/lib/types";

const TMDB_BASE = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

function authHeaders(): HeadersInit {
  const key = process.env.TMDB_API_KEY ?? "";
  // TMDB accepts either a v4 bearer token or a v3 api_key query param.
  // We support the bearer header here; v3 keys fall back to the query param.
  if (key.startsWith("ey")) {
    return { Authorization: `Bearer ${key}`, accept: "application/json" };
  }
  return { accept: "application/json" };
}

function withKey(url: URL): URL {
  const key = process.env.TMDB_API_KEY ?? "";
  if (!key.startsWith("ey")) {
    url.searchParams.set("api_key", key);
  }
  return url;
}

export interface TmdbMovie {
  id: number;
  title: string;
  release_date?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  genre_ids?: number[];
}

export interface TmdbMovieDetail extends TmdbMovie {
  genres?: { id: number; name: string }[];
  runtime?: number;
  credits?: {
    cast?: { id: number; name: string; character?: string; profile_path?: string | null }[];
  };
}

async function tmdbGet<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  const url = withKey(new URL(`${TMDB_BASE}${path}`));
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  try {
    const res = await fetch(url.toString(), {
      headers: authHeaders(),
      // TMDB metadata is stable, let Next cache it for a day.
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// Raw TV result shape. TV uses `name` and `first_air_date` instead of the
// movie fields, so we normalize both into ResolvedTitle below.
interface TmdbTv {
  id: number;
  name: string;
  first_air_date?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
}

// A normalized title (movie or TV) used across the identify pipeline.
export interface ResolvedTitle {
  id: number;
  mediaType: MediaType;
  title: string;
  year: number | null;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

function normalizeMovie(m: TmdbMovie): ResolvedTitle {
  return {
    id: m.id,
    mediaType: "movie",
    title: m.title,
    year: yearFrom(m.release_date),
    overview: m.overview ?? "",
    poster_path: m.poster_path ?? null,
    backdrop_path: m.backdrop_path ?? null,
  };
}

function normalizeTv(t: TmdbTv): ResolvedTitle {
  return {
    id: t.id,
    mediaType: "tv",
    title: t.name,
    year: yearFrom(t.first_air_date),
    overview: t.overview ?? "",
    poster_path: t.poster_path ?? null,
    backdrop_path: t.backdrop_path ?? null,
  };
}

// Resolve a candidate (title + year + media type) to a real TMDB entry.
export async function resolveByTitle(
  title: string,
  mediaType: MediaType,
  year?: number,
): Promise<ResolvedTitle | null> {
  if (mediaType === "tv") {
    const params: Record<string, string> = { query: title, include_adult: "false" };
    if (year) params.first_air_date_year = String(year);
    const data = await tmdbGet<{ results: TmdbTv[] }>("/search/tv", params);
    if (!data?.results?.length) return year ? resolveByTitle(title, "tv") : null;
    return normalizeTv(data.results[0]);
  }
  const params: Record<string, string> = { query: title, include_adult: "false" };
  if (year) params.year = String(year);
  const data = await tmdbGet<{ results: TmdbMovie[] }>("/search/movie", params);
  if (!data?.results?.length) return year ? resolveByTitle(title, "movie") : null;
  return normalizeMovie(data.results[0]);
}

// A normalized detail object for the title page (movie or TV).
export interface MediaDetail {
  id: number;
  mediaType: MediaType;
  title: string;
  year: number | null;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  runtime: number | null;
  seasons: number | null;
  genres: { id: number; name: string }[];
  voteAverage: number | null;
  cast: { id: number; name: string; character?: string; profile_path?: string | null }[];
}

export async function getMediaDetail(tmdbId: number, mediaType: MediaType): Promise<MediaDetail | null> {
  const path = mediaType === "tv" ? `/tv/${tmdbId}` : `/movie/${tmdbId}`;
  const data = await tmdbGet<Record<string, unknown>>(path, { append_to_response: "credits" });
  if (!data) return null;
  const credits = data.credits as TmdbMovieDetail["credits"] | undefined;
  return {
    id: tmdbId,
    mediaType,
    title: (mediaType === "tv" ? (data.name as string) : (data.title as string)) ?? "",
    year: yearFrom(mediaType === "tv" ? (data.first_air_date as string) : (data.release_date as string)),
    overview: (data.overview as string) ?? "",
    poster_path: (data.poster_path as string) ?? null,
    backdrop_path: (data.backdrop_path as string) ?? null,
    runtime:
      mediaType === "tv"
        ? ((data.episode_run_time as number[] | undefined)?.[0] ?? null)
        : ((data.runtime as number) ?? null),
    seasons: mediaType === "tv" ? ((data.number_of_seasons as number) ?? null) : null,
    genres: (data.genres as { id: number; name: string }[]) ?? [],
    voteAverage: (data.vote_average as number) ?? null,
    cast: credits?.cast?.slice(0, 8) ?? [],
  };
}

export async function getSimilar(tmdbId: number, mediaType: MediaType): Promise<ResolvedTitle[]> {
  const path = mediaType === "tv" ? `/tv/${tmdbId}/recommendations` : `/movie/${tmdbId}/recommendations`;
  if (mediaType === "tv") {
    const data = await tmdbGet<{ results: TmdbTv[] }>(path);
    return (data?.results ?? []).filter((t) => t.poster_path).map(normalizeTv);
  }
  const data = await tmdbGet<{ results: TmdbMovie[] }>(path);
  return (data?.results ?? []).filter((m) => m.poster_path).map(normalizeMovie);
}

// Popular posters for the hero mosaic. Returns an empty list if unconfigured,
// so the landing page can fall back to a static treatment.
export async function getTrending(): Promise<TmdbMovie[]> {
  const data = await tmdbGet<{ results: TmdbMovie[] }>("/trending/movie/week");
  return (data?.results ?? []).filter((m) => m.poster_path);
}

// A larger wall of unique poster URLs for the pixel-art hero mosaic. Pulls a few
// pages of popular titles. Empty when TMDB is not configured.
export async function getPosterWall(count = 120): Promise<string[]> {
  const pages = [1, 2, 3, 4, 5, 6];
  const batches = await Promise.all(
    pages.map((p) => tmdbGet<{ results: TmdbMovie[] }>("/movie/popular", { page: String(p) })),
  );
  const seen = new Set<number>();
  const urls: string[] = [];
  for (const data of batches) {
    for (const m of data?.results ?? []) {
      if (!m.poster_path || seen.has(m.id)) continue;
      seen.add(m.id);
      const u = posterUrl(m.poster_path, "w185");
      if (u) urls.push(u);
    }
  }
  return urls.slice(0, count);
}

export interface TmdbProviderEntry {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority?: number;
}

export interface TmdbWatchCountry {
  link?: string;
  flatrate?: TmdbProviderEntry[];
  rent?: TmdbProviderEntry[];
  buy?: TmdbProviderEntry[];
  free?: TmdbProviderEntry[];
}

// Providers come grouped as flatrate (subscription), rent, buy per country.
export async function getWatchProviders(
  tmdbId: number,
  country: string,
  mediaType: MediaType,
): Promise<TmdbWatchCountry | null> {
  const path = mediaType === "tv" ? `/tv/${tmdbId}/watch/providers` : `/movie/${tmdbId}/watch/providers`;
  const data = await tmdbGet<{ results: Record<string, TmdbWatchCountry> }>(path);
  if (!data?.results) return null;
  return data.results[country.toUpperCase()] ?? null;
}

export function posterUrl(path: string | null | undefined, size = "w500"): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function logoUrl(path: string | null | undefined, size = "w92"): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function yearFrom(releaseDate?: string): number | null {
  if (!releaseDate) return null;
  const y = Number(releaseDate.slice(0, 4));
  return Number.isFinite(y) ? y : null;
}
