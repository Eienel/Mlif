// TMDB client. Server only. Catalog, search, posters, overviews, and the
// JustWatch-powered /watch/providers endpoint.

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

// Resolve a candidate (title + year) to a real TMDB movie.
export async function resolveByTitle(title: string, year?: number): Promise<TmdbMovie | null> {
  const params: Record<string, string> = { query: title, include_adult: "false" };
  if (year) params.year = String(year);
  const data = await tmdbGet<{ results: TmdbMovie[] }>("/search/movie", params);
  if (!data?.results?.length) {
    // Retry without the year constraint in case the remembered year was off.
    if (year) return resolveByTitle(title);
    return null;
  }
  return data.results[0];
}

export async function getMovieDetail(tmdbId: number): Promise<TmdbMovieDetail | null> {
  return tmdbGet<TmdbMovieDetail>(`/movie/${tmdbId}`, { append_to_response: "credits" });
}

export async function getSimilar(tmdbId: number): Promise<TmdbMovie[]> {
  const data = await tmdbGet<{ results: TmdbMovie[] }>(`/movie/${tmdbId}/recommendations`);
  return data?.results ?? [];
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
): Promise<TmdbWatchCountry | null> {
  const data = await tmdbGet<{ results: Record<string, TmdbWatchCountry> }>(
    `/movie/${tmdbId}/watch/providers`,
  );
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
