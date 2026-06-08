// Assemble where-to-watch data by fusing TMDB providers with Watchmode sources.
// Results are cached per (tmdb_id, country) in Supabase with a 24h TTL to stay
// inside the free tiers.
//
// Hard rule: only recognized legal providers are ever included. Watchmode's
// `free` type is legal ad-supported (Tubi, Pluto TV, Freevee, Crackle). We never
// surface or link anything outside TMDB and Watchmode.

import { createAdminClient } from "@/lib/supabase/admin";
import { getWatchProviders, logoUrl } from "@/lib/tmdb";
import { getWatchmodeSources } from "@/lib/watchmode";
import type { WatchData, WatchOption } from "@/lib/types";

const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

function dedupe(options: WatchOption[]): WatchOption[] {
  const seen = new Set<string>();
  const out: WatchOption[] = [];
  for (const opt of options) {
    const key = opt.providerName.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(opt);
  }
  return out;
}

async function buildWatchData(tmdbId: number, country: string): Promise<WatchData> {
  const cc = country.toUpperCase();
  const [tmdb, sources] = await Promise.all([
    getWatchProviders(tmdbId, cc),
    getWatchmodeSources(tmdbId, [cc]),
  ]);

  const tmdbWatchPage = tmdb?.link ?? null;

  // TMDB gives provider names and logos but not deep links, so we link out to
  // the TMDB watch page. Watchmode gives real deep links and free sources.
  const fromTmdb = (entries = tmdb?.flatrate, type: WatchOption["type"] = "flatrate") =>
    (entries ?? []).map<WatchOption>((p) => ({
      type,
      providerName: p.provider_name,
      logoUrl: logoUrl(p.logo_path),
      link: tmdbWatchPage ?? "",
      price: null,
      format: null,
    }));

  const flatrate = fromTmdb(tmdb?.flatrate, "flatrate");
  const rent = fromTmdb(tmdb?.rent, "rent");
  const buy = fromTmdb(tmdb?.buy, "buy");

  // Watchmode free sources are the authoritative legal ad-supported row.
  const free: WatchOption[] = [];
  for (const s of sources) {
    const link = s.web_url ?? "";
    if (!link) continue;
    const base: WatchOption = {
      type: "free",
      providerName: s.name,
      logoUrl: s.logo_100px ?? null,
      link,
      price: s.price ?? null,
      format: s.format ?? null,
    };
    if (s.type === "free") {
      free.push(base);
    } else if (s.type === "rent") {
      rent.push({ ...base, type: "rent" });
    } else if (s.type === "purchase") {
      buy.push({ ...base, type: "buy" });
    } else if (s.type === "sub" || s.type === "tve") {
      flatrate.push({ ...base, type: "flatrate" });
    }
  }

  return {
    country: cc,
    tmdbWatchPage,
    flatrate: dedupe(flatrate),
    free: dedupe(free),
    rent: dedupe(rent),
    buy: dedupe(buy),
  };
}

export async function getWatchData(tmdbId: number, country: string): Promise<WatchData> {
  const cc = country.toUpperCase();

  // Cache is best-effort. If Supabase is not configured, fall through to live.
  try {
    const admin = createAdminClient();
    const { data: cached } = await admin
      .from("provider_cache")
      .select("payload, fetched_at")
      .eq("tmdb_id", tmdbId)
      .eq("country", cc)
      .maybeSingle();

    if (cached) {
      const age = Date.now() - new Date(cached.fetched_at).getTime();
      if (age < CACHE_TTL_MS) {
        return cached.payload as WatchData;
      }
    }

    const fresh = await buildWatchData(tmdbId, cc);
    await admin
      .from("provider_cache")
      .upsert({ tmdb_id: tmdbId, country: cc, payload: fresh, fetched_at: new Date().toISOString() });
    return fresh;
  } catch {
    return buildWatchData(tmdbId, cc);
  }
}
