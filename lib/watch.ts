// Assemble where-to-watch data by fusing TMDB providers with Watchmode sources.
// Results are cached per (tmdb_id, country) in Supabase with a 24h TTL to stay
// inside the free tiers.
//
// Hard rule: only recognized legal providers are ever included. Watchmode's
// `free` type is legal ad-supported (Tubi, Pluto TV, Freevee, Crackle). We never
// surface or link anything outside TMDB and Watchmode.

import { createAdminClient } from "@/lib/supabase/admin";
import { getWatchProviders, logoUrl, type TmdbProviderEntry } from "@/lib/tmdb";
import { getWatchmodeSources } from "@/lib/watchmode";
import type { MediaType, WatchData, WatchOption } from "@/lib/types";

const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

// Normalize provider names so TMDB and Watchmode entries for the same service
// (for example "Amazon Prime Video" vs "Prime Video with Ads") collapse together.
function norm(name: string): string {
  return name
    .toLowerCase()
    .replace(/\bwith ads\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

type Cat = "flatrate" | "free" | "rent" | "buy";

async function buildWatchData(tmdbId: number, country: string, mediaType: MediaType): Promise<WatchData> {
  const cc = country.toUpperCase();
  const [tmdb, sources] = await Promise.all([
    getWatchProviders(tmdbId, cc, mediaType),
    getWatchmodeSources(tmdbId, [cc], mediaType),
  ]);

  const tmdbWatchPage = tmdb?.link ?? null;

  // TMDB has the cleanest provider logos. Index them by normalized name so we
  // can pair them with Watchmode's deep links.
  const tmdbLogos = new Map<string, string | null>();
  for (const group of [tmdb?.flatrate, tmdb?.rent, tmdb?.buy, tmdb?.free]) {
    for (const p of group ?? []) tmdbLogos.set(norm(p.provider_name), logoUrl(p.logo_path));
  }

  const cats: Record<Cat, Map<string, WatchOption>> = {
    flatrate: new Map(),
    free: new Map(),
    rent: new Map(),
    buy: new Map(),
  };

  // 1) Watchmode first: these carry real deep links straight to the provider's
  // page for this title, which is what we want to surface.
  for (const s of sources) {
    const link = s.web_url;
    if (!link) continue;
    const type: Cat | null =
      s.type === "free"
        ? "free"
        : s.type === "rent"
          ? "rent"
          : s.type === "purchase"
            ? "buy"
            : s.type === "sub" || s.type === "tve"
              ? "flatrate"
              : null;
    if (!type) continue;
    const key = norm(s.name);
    const opt: WatchOption = {
      type,
      providerName: s.name,
      logoUrl: tmdbLogos.get(key) ?? s.logo_100px ?? null,
      link,
      price: s.price ?? null,
      format: s.format ?? null,
    };
    const existing = cats[type].get(key);
    // Keep the cheapest for rent/buy, otherwise the first deep link wins.
    if (!existing) cats[type].set(key, opt);
    else if ((type === "rent" || type === "buy") && opt.price != null && (existing.price == null || opt.price < existing.price)) {
      cats[type].set(key, opt);
    }
  }

  // 2) Fill in any TMDB-only providers (no Watchmode deep link). These fall back
  // to the TMDB watch page, which is still a safe, legal hand-off.
  const addTmdb = (entries: TmdbProviderEntry[] | undefined, type: Cat) => {
    for (const p of entries ?? []) {
      const key = norm(p.provider_name);
      if (cats[type].has(key)) continue;
      cats[type].set(key, {
        type,
        providerName: p.provider_name,
        logoUrl: logoUrl(p.logo_path),
        link: tmdbWatchPage ?? "",
        price: null,
        format: null,
      });
    }
  };
  addTmdb(tmdb?.flatrate, "flatrate");
  addTmdb(tmdb?.rent, "rent");
  addTmdb(tmdb?.buy, "buy");
  addTmdb(tmdb?.free, "free");

  return {
    country: cc,
    tmdbWatchPage,
    flatrate: [...cats.flatrate.values()],
    free: [...cats.free.values()],
    rent: [...cats.rent.values()],
    buy: [...cats.buy.values()],
  };
}

export async function getWatchData(
  tmdbId: number,
  country: string,
  mediaType: MediaType = "movie",
): Promise<WatchData> {
  const cc = country.toUpperCase();
  // Movie and TV ids share the integer space, so fold the media type into the
  // cache key (the country column) to keep them distinct without a schema change.
  const cacheKey = mediaType === "tv" ? `${cc}:tv` : cc;

  // Cache is best-effort. If Supabase is not configured, fall through to live.
  try {
    const admin = createAdminClient();
    const { data: cached } = await admin
      .from("provider_cache")
      .select("payload, fetched_at")
      .eq("tmdb_id", tmdbId)
      .eq("country", cacheKey)
      .maybeSingle();

    if (cached) {
      const age = Date.now() - new Date(cached.fetched_at).getTime();
      if (age < CACHE_TTL_MS) {
        return cached.payload as WatchData;
      }
    }

    const fresh = await buildWatchData(tmdbId, cc, mediaType);
    await admin
      .from("provider_cache")
      .upsert({ tmdb_id: tmdbId, country: cacheKey, payload: fresh, fetched_at: new Date().toISOString() });
    return fresh;
  } catch {
    return buildWatchData(tmdbId, cc, mediaType);
  }
}
