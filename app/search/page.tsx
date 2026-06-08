import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SearchExperience } from "@/components/search-experience";
import { createClient } from "@/lib/supabase/server";
import type { IdentifyMode } from "@/lib/types";

export const metadata: Metadata = {
  title: "Find a film",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; mode?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initialQuery = searchParams.q ?? "";
  const initialMode: IdentifyMode = searchParams.mode === "recommend" ? "recommend" : "identify";

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Describe the film.
        </h1>
        <p className="mt-2 text-muted">
          A scene, a mood, a fragment of a line. We will rank the likely matches.
        </p>
        <div className="mt-7">
          <SearchExperience authed={Boolean(user)} initialQuery={initialQuery} initialMode={initialMode} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
