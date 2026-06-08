"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { MagnifyingGlass, FilmSlate, Sparkle, Warning } from "@phosphor-icons/react";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/countries";
import type { IdentifyMode, IdentifyResponse, IdentifiedTitle } from "@/lib/types";
import { ResultCard } from "@/components/result-card";
import { ResultSkeleton } from "@/components/result-skeleton";

type Status = "idle" | "loading" | "done" | "error";

interface SearchExperienceProps {
  authed: boolean;
  initialQuery?: string;
  initialMode?: IdentifyMode;
}

export function SearchExperience({ authed, initialQuery = "", initialMode = "identify" }: SearchExperienceProps) {
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<IdentifyMode>(initialMode);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<IdentifiedTitle[]>([]);
  const [grounded, setGrounded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const ranInitial = useRef(false);

  const run = useCallback(
    async (q: string, m: IdentifyMode, cc: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      setStatus("loading");
      setError(null);
      setLimitReached(false);
      try {
        const res = await fetch("/api/identify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ query: trimmed, mode: m, country: cc }),
        });
        const data = (await res.json()) as IdentifyResponse & { error?: string; limitReached?: boolean };
        if (!res.ok) {
          setStatus("error");
          setError(data.error ?? "Something went wrong.");
          setLimitReached(Boolean(data.limitReached));
          return;
        }
        setResults(data.results ?? []);
        setGrounded(Boolean(data.grounded));
        setStatus("done");
      } catch {
        setStatus("error");
        setError("Network hiccup. Try again.");
      }
    },
    [],
  );

  // Auto-run when arriving with a query in the URL.
  useEffect(() => {
    if (initialQuery && !ranInitial.current) {
      ranInitial.current = true;
      void run(initialQuery, initialMode, DEFAULT_COUNTRY);
    }
  }, [initialQuery, initialMode, run]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void run(query, mode, country);
  }

  function onCountryChange(cc: string) {
    setCountry(cc);
    // Re-run with the new region if we already have results.
    if (status === "done" || status === "error") void run(query, mode, cc);
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="rounded-card border border-hairline bg-surface p-3 shadow-warm">
        <div className="flex items-center gap-2 rounded-input bg-surface-2 px-3">
          <MagnifyingGlass size={20} className="shrink-0 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              mode === "identify"
                ? "The one where a guy relives the same day and falls in love..."
                : "Something like Interstellar but lighter..."
            }
            aria-label="Describe a film"
            className="h-12 w-full bg-transparent text-base text-ink outline-none placeholder:text-muted"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-full bg-surface-2 p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode("identify")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-colors ${
                mode === "identify" ? "bg-surface text-ink shadow-warm" : "text-muted"
              }`}
            >
              <FilmSlate size={16} /> Identify
            </button>
            <button
              type="button"
              onClick={() => setMode("recommend")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-colors ${
                mode === "recommend" ? "bg-surface text-ink shadow-warm" : "text-muted"
              }`}
            >
              <Sparkle size={16} /> Recommend
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="country">
              Country
            </label>
            <select
              id="country"
              value={country}
              onChange={(e) => onCountryChange(e.target.value)}
              className="rounded-input border border-hairline bg-surface px-3 py-2 text-sm text-ink outline-none"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={status === "loading" || !query.trim()}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {status === "loading" ? "Finding..." : "Find it"}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-8">
        {status === "loading" ? (
          <div className="space-y-4">
            <ResultSkeleton />
            <ResultSkeleton />
            <ResultSkeleton />
          </div>
        ) : null}

        {status === "error" ? (
          <div className="rounded-card border border-hairline bg-surface p-8 text-center shadow-warm">
            <Warning size={28} className="mx-auto text-accent" />
            <p className="mt-3 text-ink">{error}</p>
            {limitReached ? (
              <a
                href="/#pricing"
                className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white"
              >
                See Pro
              </a>
            ) : null}
          </div>
        ) : null}

        {status === "done" && results.length === 0 ? (
          <div className="rounded-card border border-hairline bg-surface p-8 text-center shadow-warm">
            <FilmSlate size={28} className="mx-auto text-muted" />
            <p className="mt-3 font-display text-lg text-ink">No confident match yet</p>
            <p className="mt-1 text-sm text-muted">
              Add a detail you remember: a scene, a line, the mood, roughly the decade.
            </p>
          </div>
        ) : null}

        {status === "done" && results.length > 0 ? (
          <div className="space-y-4">
            {grounded ? (
              <p className="text-xs text-muted">Confirmed against a quick web check.</p>
            ) : null}
            {results.map((r, i) => (
              <motion.div
                key={r.tmdbId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 26, delay: i * 0.05 }}
              >
                <ResultCard result={r} authed={authed} />
              </motion.div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
