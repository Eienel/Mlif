import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

// Top nav, one line at desktop. No accounts: the only destinations are the
// product sections and the local watchlist.
export function SiteHeader() {
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
            href="/watchlist"
            className="rounded-input px-3 py-2 transition-colors hover:text-ink"
          >
            Watchlist
          </Link>
          <Link
            href="/search"
            className="rounded-full bg-ink px-4 py-2 font-medium text-white transition-opacity hover:opacity-90"
          >
            Find a film
          </Link>
        </nav>
      </div>
    </header>
  );
}
