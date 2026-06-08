# Premise

Describe it. Find it. Watch it.

Premise identifies a film from a vague description ("the one where a guy relives
the same day and falls in love"), then shows where to watch it legally:
subscription services, rent or buy, and free ad-supported platforms like Tubi,
Pluto TV, Freevee, and Crackle. It never links to piracy.

## Stack

- Next.js 14 App Router, TypeScript, React Server Components
- Tailwind v4 (`@tailwindcss/postcss`)
- Gemini API for the reasoning layer (server only, free tier)
- TMDB and Watchmode for catalog and where-to-watch data
- Motion for restrained spring animation
- Supabase (optional): server-side provider cache and per-IP fair-use counter

## How identification works

1. The description is sent to `/api/identify` (server only, key never reaches the client).
2. Gemini returns up to 6 ranked candidates as strict JSON, each with a title,
   year, confidence, and a one-sentence reason.
3. If confidence is low or there are no candidates, a confidence-gated grounding
   pass runs (Gemini's built-in Google Search) to confirm the film exists. Grounding
   only names films, it never sources watch links.
4. Each candidate is resolved against TMDB for the real id, poster, and overview.
5. For the top candidates, TMDB providers are fused with Watchmode sources to build
   the where-to-watch rows, cached per `(tmdb_id, country)` in Supabase for 24h.

## Free, no signup

Premise is completely free with no accounts, in line with TMDB's non-commercial
API terms. The watchlist lives in the browser (localStorage), so saving is instant
and needs no login. A generous per-IP daily fair-use cap protects the shared free
API quotas; it is enforced server-side and is not a paywall.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in the keys you have
npm run dev
```

You only need `GEMINI_API_KEY` and `TMDB_API_KEY` to run the core experience.
Watchmode adds the free ad-supported sources. Supabase is optional: without it the
provider cache and rate-limit simply no-op, and without TMDB the hero falls back to
a static panel.

## Database (optional)

Run `supabase/schema.sql` in the Supabase SQL editor if you want the server-side
provider cache and per-IP fair-use counter. It creates `provider_cache`,
`anon_usage`, and the phase-2 `title_embeddings` table, all service-role only.

## Environment variables

See `.env.example`. Everything except `NEXT_PUBLIC_*` is server only and must never
be exposed to the client.

## Deploy (Vercel)

1. Import the repo, framework preset Next.js.
2. Add the variables from `.env.example` for Production and Preview.
3. Set `NEXT_PUBLIC_SITE_URL` to the deployment URL.
4. Verify identify and watch links in Preview before promoting.
