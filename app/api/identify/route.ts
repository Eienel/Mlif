import { NextResponse } from "next/server";
import { runIdentify } from "@/lib/gemini";
import { resolveByTitle, posterUrl, yearFrom } from "@/lib/tmdb";
import { getWatchData } from "@/lib/watch";
import { consumeForAnon } from "@/lib/usage";
import type {
  IdentifiedTitle,
  IdentifyMode,
  IdentifyResponse,
  LlmCandidate,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// Resolve LLM candidates against TMDB and assemble watch data for the top picks.
async function resolve(
  candidates: LlmCandidate[],
  country: string,
): Promise<IdentifiedTitle[]> {
  const resolved = await Promise.all(
    candidates.map(async (c) => {
      const movie = await resolveByTitle(c.title, c.year || undefined);
      if (!movie) return null;
      return {
        tmdbId: movie.id,
        title: movie.title,
        year: yearFrom(movie.release_date),
        overview: movie.overview ?? "",
        posterPath: movie.poster_path ?? null,
        backdropPath: movie.backdrop_path ?? null,
        confidence: c.confidence,
        reasoning: c.reasoning,
        watch: null as IdentifiedTitle["watch"],
      } satisfies IdentifiedTitle;
    }),
  );

  // Drop unresolved and de-duplicate by tmdb id, keeping the highest confidence.
  const byId = new Map<number, IdentifiedTitle>();
  for (const r of resolved) {
    if (!r) continue;
    const existing = byId.get(r.tmdbId);
    if (!existing || r.confidence > existing.confidence) byId.set(r.tmdbId, r);
  }
  const unique = [...byId.values()].sort((a, b) => b.confidence - a.confidence);

  // Assemble watch data for the top candidates only, to respect free tiers.
  const TOP_N = 4;
  await Promise.all(
    unique.slice(0, TOP_N).map(async (t) => {
      t.watch = await getWatchData(t.tmdbId, country);
    }),
  );

  return unique;
}

export async function POST(req: Request) {
  let body: { query?: string; mode?: IdentifyMode; country?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const query = (body.query ?? "").trim();
  const mode: IdentifyMode = body.mode === "recommend" ? "recommend" : "identify";
  const country = (body.country ?? "US").toUpperCase();

  if (!query) {
    return NextResponse.json({ error: "Describe a film to get started." }, { status: 400 });
  }
  if (query.length > 1000) {
    return NextResponse.json({ error: "That description is too long." }, { status: 400 });
  }

  // Fair-use daily cap, enforced server-side per IP. Not a paywall, just quota
  // safety so one visitor cannot exhaust the shared free API limits.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anon";
  const usage = await consumeForAnon(ip);
  if (!usage.allowed) {
    return NextResponse.json(
      { error: "You have hit today's fair-use limit. Check back tomorrow.", limitReached: true },
      { status: 429 },
    );
  }

  try {
    const engine = await runIdentify(query, mode);
    const results = await resolve(engine.candidates, country);

    const payload: IdentifyResponse = {
      query,
      mode,
      country,
      grounded: engine.grounded,
      results,
    };
    return NextResponse.json(payload);
  } catch (err) {
    console.error("identify failed", err);
    return NextResponse.json(
      { error: "Something went wrong identifying that film. Try rephrasing." },
      { status: 500 },
    );
  }
}
