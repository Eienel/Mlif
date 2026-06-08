import { Wordmark } from "@/components/wordmark";

// Footer. TMDB and Watchmode attribution is required by their terms.
export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-surface-2">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Wordmark />
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Describe a film from a vague memory. We name it, then show where to
              watch it legally, including free ad-supported platforms.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm">
            <div>
              <p className="font-medium text-ink">Product</p>
              <ul className="mt-3 space-y-2 text-muted">
                <li>
                  <a href="/#how" className="transition-colors hover:text-ink">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="/#pricing" className="transition-colors hover:text-ink">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="/watchlist" className="transition-colors hover:text-ink">
                    Watchlist
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-ink">Data</p>
              <ul className="mt-3 space-y-2 text-muted">
                <li>
                  <a
                    href="https://www.themoviedb.org/"
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors hover:text-ink"
                  >
                    The Movie Database
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.watchmode.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors hover:text-ink"
                  >
                    Watchmode
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-2 border-t border-hairline pt-6 text-xs leading-relaxed text-muted">
          <p>
            This product uses the TMDB API but is not endorsed or certified by
            TMDB. Streaming availability data provided by Watchmode.
          </p>
          <p>
            We only link to legitimate sources. Free means legal ad-supported
            services. We never link to piracy.
          </p>
          <p>© {new Date().getFullYear()} Premise.</p>
        </div>
      </div>
    </footer>
  );
}
