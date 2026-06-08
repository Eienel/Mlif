import { Suspense } from "react";
import Link from "next/link";
import { FilmSlate, MagnifyingGlass, MonitorPlay, Television } from "@phosphor-icons/react/dist/ssr";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroSearch } from "@/components/hero-search";
import { ExampleQueries } from "@/components/example-queries";
import { PosterMosaic } from "@/components/poster-mosaic";
import { Reveal } from "@/components/reveal";

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />

      {/* Split hero. Value prop and live search left, poster mosaic right. */}
      <section className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl items-center gap-12 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-1.5 text-sm text-muted">
            <FilmSlate size={16} className="text-accent" />
            Describe it. Find it. Watch it.
          </p>
          <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.04] tracking-tight text-ink sm:text-6xl">
            The movie you
            <br />
            half remember.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
            Type the fuzzy memory. We name the film and show where it plays, free
            ad-supported platforms included.
          </p>
          <div className="mt-7 max-w-xl">
            <HeroSearch />
          </div>
          <p className="mt-3 text-sm text-muted">
            No account needed. Completely free.
          </p>
        </div>

        <div className="h-[460px] lg:h-[520px]">
          <Suspense fallback={<div className="h-full w-full rounded-card bg-surface-2" />}>
            <PosterMosaic />
          </Suspense>
        </div>
      </section>

      {/* How it works. Three steps, varied layout, not identical cards. */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            From a vague memory to play tonight, in three steps.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-12">
          <Reveal className="md:col-span-7">
            <div className="flex h-full flex-col justify-between rounded-card border border-hairline bg-surface p-7 shadow-warm">
              <span className="font-display text-5xl text-accent">01</span>
              <div className="mt-10">
                <h3 className="font-display text-xl font-semibold text-ink">Describe it loosely</h3>
                <p className="mt-2 max-w-md text-muted">
                  A scene, a mood, a half-remembered line. No title required, that is
                  the whole point.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.05} className="md:col-span-5">
            <div className="flex h-full flex-col justify-between rounded-card border border-hairline bg-ink p-7 text-white shadow-warm">
              <span className="font-display text-5xl text-accent">02</span>
              <div className="mt-10">
                <h3 className="font-display text-xl font-semibold">We reason it out</h3>
                <p className="mt-2 text-white/70">
                  A ranked shortlist of real films, each with one line on why it fits.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="md:col-span-12">
            <div className="flex flex-col items-start justify-between gap-6 rounded-card border border-hairline bg-surface p-7 shadow-warm md:flex-row md:items-center">
              <div className="flex items-center gap-5">
                <span className="font-display text-5xl text-accent">03</span>
                <div>
                  <h3 className="font-display text-xl font-semibold text-ink">See where it plays</h3>
                  <p className="mt-2 max-w-lg text-muted">
                    Subscription, rent or buy, and legal free ad-supported services,
                    grouped clearly by your country.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 text-muted">
                <MonitorPlay size={28} />
                <Television size={28} />
                <MagnifyingGlass size={28} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Example queries to tap and run. */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <Reveal>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Try one of these.
          </h2>
          <p className="mt-2 text-muted">Tap to run it.</p>
        </Reveal>
        <Reveal delay={0.05} className="mt-7">
          <ExampleQueries />
        </Reveal>
      </section>

      {/* Legal-free angle. */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <Reveal>
          <div className="rounded-card border border-hairline bg-surface-2 p-8 sm:p-12">
            <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Find what you can watch tonight, for free.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
              We surface legal ad-supported platforms like Tubi, Pluto TV, Freevee,
              and Crackle, right next to the paid options. Free means free and legal.
              We never link to piracy.
            </p>
            <Link
              href="/search?q=a%20cozy%20movie%20to%20watch%20free%20tonight"
              className="mt-6 inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Find a free film
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Closing note. Premise is free, no tiers, no paywall. */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <div className="rounded-card border-2 border-accent bg-surface p-8 text-center shadow-warm-lg sm:p-12">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Free, with no catch.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted">
              No tiers, no paywall, no card. Describe a film and find where to watch
              it, every time.
            </p>
            <Link
              href="/search"
              className="mt-6 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Find a film
            </Link>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}
