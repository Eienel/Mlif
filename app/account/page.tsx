import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BillingButton } from "@/components/billing-button";
import { createClient } from "@/lib/supabase/server";
import { FREE_DAILY_LIMIT } from "@/lib/usage";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, daily_searches, daily_reset_at")
    .eq("id", user.id)
    .maybeSingle();

  const isPro = profile?.plan === "pro";
  const today = new Date().toISOString().slice(0, 10);
  const usedToday = profile && profile.daily_reset_at === today ? profile.daily_searches : 0;

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Account</h1>

        <div className="mt-8 space-y-4">
          <div className="rounded-card border border-hairline bg-surface p-6 shadow-warm">
            <p className="text-sm text-muted">Signed in as</p>
            <p className="mt-1 text-ink">{user.email}</p>
          </div>

          <div className="rounded-card border border-hairline bg-surface p-6 shadow-warm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted">Plan</p>
                <p className="mt-1 font-display text-2xl font-semibold text-ink">
                  {isPro ? "Pro" : "Free"}
                </p>
                {!isPro ? (
                  <p className="mt-1 text-sm text-muted">
                    {usedToday} of {FREE_DAILY_LIMIT} identifications used today.
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted">Unlimited identifications and watchlist.</p>
                )}
              </div>
              <BillingButton isPro={isPro} />
            </div>
          </div>

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-full border border-hairline bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent"
            >
              Sign out
            </button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
