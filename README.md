# Premise

Describe it. Find it. Watch it.

Premise identifies a film from a vague description ("the one where a guy relives
the same day and falls in love"), then shows where to watch it legally:
subscription services, rent or buy, and free ad-supported platforms like Tubi,
Pluto TV, Freevee, and Crackle. It never links to piracy.

## Stack

- Next.js 14 App Router, TypeScript, React Server Components
- Tailwind v4 (`@tailwindcss/postcss`)
- Supabase: Postgres + Auth (email magic link + Google), RLS
- Anthropic API for the reasoning layer (server only)
- TMDB and Watchmode for catalog and where-to-watch data
- Motion for restrained spring animation
- Billing: Lemon Squeezy (worldwide card and PayPal) plus Coinbase Commerce (USDC)

## How identification works

1. The description is sent to `/api/identify` (server only, key never reaches the client).
2. Anthropic returns up to 6 ranked candidates as strict JSON, each with a title,
   year, confidence, and a one-sentence reason.
3. If confidence is low or there are no candidates, a confidence-gated web grounding
   pass runs (Anthropic's built-in web search) to confirm the film exists. Grounding
   only names films, it never sources watch links.
4. Each candidate is resolved against TMDB for the real id, poster, and overview.
5. For the top candidates, TMDB providers are fused with Watchmode sources to build
   the where-to-watch rows, cached per `(tmdb_id, country)` in Supabase for 24h.

## Billing

Stripe does not onboard merchants in every country, so Premise uses two rails so
the merchant can collect from users worldwide:

- **Lemon Squeezy** for card and PayPal, with real recurring monthly subscriptions.
  As a merchant of record it handles global tax and pays out internationally.
- **Coinbase Commerce** for USDC and other crypto. Crypto cannot auto-recur, so a
  payment grants a 30-day Pro pass that the user renews manually.

Both unlock the same Pro features. Gating is enforced server-side via `isProActive`,
which treats a card subscription as active until cancelled and a crypto pass as
active until its expiry.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in the keys you have
npm run dev
```

The app degrades gracefully: without Supabase keys it renders logged-out, without
billing keys the upgrade buttons return a clear "not configured" error, and without
TMDB the hero falls back to a static panel.

## Database

Run `supabase/schema.sql` in the Supabase SQL editor. It creates `profiles`,
`watchlist`, `provider_cache`, `anon_usage`, and the phase-2 `title_embeddings`
table, turns on Row Level Security, and adds a trigger that creates a profile row
on sign-up. Users can read and write only their own rows; `provider_cache` and
`anon_usage` are service-role only.

## Environment variables

See `.env.example`. Everything except `NEXT_PUBLIC_*` is server only and must never
be exposed to the client.

## Deploy (Vercel)

1. Import the repo, framework preset Next.js.
2. Add every variable from `.env.example` for Production and Preview.
3. Set `NEXT_PUBLIC_SITE_URL` to the deployment URL.
4. Point the Lemon Squeezy webhook at `/api/webhooks/lemonsqueezy` and the Coinbase
   Commerce webhook at `/api/webhooks/coinbase`, then copy each signing secret in.
5. Add the deployment URL to Supabase auth redirect URLs.
6. Verify identify, watch links, auth, and a test payment in Preview before promoting.
