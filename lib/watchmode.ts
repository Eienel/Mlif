// Watchmode client. Server only. More accurate sources, real deep links, and a
// `free` source type for legal ad-supported platforms (Tubi, Pluto TV, etc.).

const WATCHMODE_BASE = "https://api.watchmode.com/v1";

export interface WatchmodeSource {
  source_id: number;
  name: string;
  type: "sub" | "free" | "purchase" | "rent" | "tve";
  region: string;
  ios_url?: string;
  android_url?: string;
  web_url?: string;
  format?: string;
  price?: number | null;
  logo_100px?: string;
}

// Look up a Watchmode title id from a TMDB id, then pull its sources.
// We use the search endpoint by tmdb id rather than burning the id-map call.
export async function getWatchmodeSources(
  tmdbId: number,
  countries: string[],
): Promise<WatchmodeSource[]> {
  const key = process.env.WATCHMODE_API_KEY;
  if (!key) return [];

  try {
    const searchUrl = new URL(`${WATCHMODE_BASE}/search/`);
    searchUrl.searchParams.set("apiKey", key);
    searchUrl.searchParams.set("search_field", "tmdb_movie_id");
    searchUrl.searchParams.set("search_value", String(tmdbId));

    const searchRes = await fetch(searchUrl.toString(), {
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!searchRes.ok) return [];
    const searchData = (await searchRes.json()) as {
      title_results?: { id: number }[];
    };
    const watchmodeId = searchData.title_results?.[0]?.id;
    if (!watchmodeId) return [];

    const sourcesUrl = new URL(`${WATCHMODE_BASE}/title/${watchmodeId}/sources/`);
    sourcesUrl.searchParams.set("apiKey", key);
    if (countries.length) sourcesUrl.searchParams.set("regions", countries.join(","));

    const sourcesRes = await fetch(sourcesUrl.toString(), {
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!sourcesRes.ok) return [];
    const sources = (await sourcesRes.json()) as WatchmodeSource[];
    return Array.isArray(sources) ? sources : [];
  } catch {
    return [];
  }
}
