import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isProActive } from "@/lib/plan";

export const runtime = "nodejs";

// The watchlist is a Pro feature. We gate on active Pro access server-side.
async function requirePro() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, plan_expires_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!isProActive(profile)) {
    return { error: NextResponse.json({ error: "Watchlist is a Pro feature." }, { status: 402 }) };
  }
  return { supabase, user };
}

export async function POST(req: Request) {
  const gate = await requirePro();
  if (gate.error) return gate.error;

  const body = (await req.json()) as {
    tmdbId?: number;
    title?: string;
    posterPath?: string | null;
    notifyWhenFree?: boolean;
  };
  if (!body.tmdbId || !body.title) {
    return NextResponse.json({ error: "Missing title." }, { status: 400 });
  }

  const { error } = await gate.supabase.from("watchlist").upsert(
    {
      user_id: gate.user.id,
      tmdb_id: body.tmdbId,
      title: body.title,
      poster_path: body.posterPath ?? null,
      notify_when_free: body.notifyWhenFree ?? false,
    },
    { onConflict: "user_id,tmdb_id" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const gate = await requirePro();
  if (gate.error) return gate.error;

  const body = (await req.json()) as { tmdbId?: number };
  if (!body.tmdbId) return NextResponse.json({ error: "Missing title." }, { status: 400 });

  const { error } = await gate.supabase
    .from("watchlist")
    .delete()
    .eq("user_id", gate.user.id)
    .eq("tmdb_id", body.tmdbId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Toggle the "notify when free" flag on a saved title.
export async function PATCH(req: Request) {
  const gate = await requirePro();
  if (gate.error) return gate.error;

  const body = (await req.json()) as { tmdbId?: number; notifyWhenFree?: boolean };
  if (!body.tmdbId) return NextResponse.json({ error: "Missing title." }, { status: 400 });

  const { error } = await gate.supabase
    .from("watchlist")
    .update({ notify_when_free: Boolean(body.notifyWhenFree) })
    .eq("user_id", gate.user.id)
    .eq("tmdb_id", body.tmdbId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
