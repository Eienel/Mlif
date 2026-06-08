import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { BookmarkSimple } from "@phosphor-icons/react/dist/ssr";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WatchlistItem } from "@/components/watchlist-item";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Watchlist" };

export default async function WatchlistPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/watchlist");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();

  const isPro = profile?.plan === "pro";

  const { data: items } = isPro
    ? await supabase
        .from("watchlist")
        .select("tmdb_id, title, poster_path, notify_when_free")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Your watchlist</h1>

        {!isPro ? (
          <div className="mt-8 rounded-card border border-hairline bg-surface p-8 text-center shadow-warm">
            <BookmarkSimple size={28} className="mx-auto text-accent" />
            <p className="mt-3 font-display text-xl text-ink">Watchlist is a Pro feature</p>
            <p className="mt-1 text-muted">
              Save titles and get an alert when one lands on a free platform.
            </p>
            <Link
              href="/#pricing"
              className="mt-5 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white"
            >
              Go Pro
            </Link>
          </div>
        ) : !items || items.length === 0 ? (
          <div className="mt-8 rounded-card border border-hairline bg-surface p-8 text-center shadow-warm">
            <BookmarkSimple size={28} className="mx-auto text-muted" />
            <p className="mt-3 font-display text-xl text-ink">Nothing saved yet</p>
            <p className="mt-1 text-muted">Identify a film, then tap Save to keep it here.</p>
            <Link
              href="/search"
              className="mt-5 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white"
            >
              Find a film
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {items.map((it) => (
              <WatchlistItem
                key={it.tmdb_id}
                tmdbId={it.tmdb_id}
                title={it.title}
                posterPath={it.poster_path}
                notifyWhenFree={it.notify_when_free}
              />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
