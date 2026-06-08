import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { createClient } from "@/lib/supabase/server";

// Top nav, one line at desktop. Auth-aware: shows account links when signed in.
export async function SiteHeader() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Wordmark />
        <nav className="flex items-center gap-1 text-sm text-muted sm:gap-2">
          <Link
            href="/#how"
            className="hidden rounded-input px-3 py-2 transition-colors hover:text-ink sm:block"
          >
            How it works
          </Link>
          <Link
            href="/#pricing"
            className="hidden rounded-input px-3 py-2 transition-colors hover:text-ink sm:block"
          >
            Pricing
          </Link>
          {user ? (
            <>
              <Link
                href="/watchlist"
                className="rounded-input px-3 py-2 transition-colors hover:text-ink"
              >
                Watchlist
              </Link>
              <Link
                href="/account"
                className="rounded-full bg-ink px-4 py-2 font-medium text-white transition-opacity hover:opacity-90"
              >
                Account
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-ink px-4 py-2 font-medium text-white transition-opacity hover:opacity-90"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
