import Image from "next/image";
import { getTrending, posterUrl } from "@/lib/tmdb";

// Hero-right poster mosaic from real TMDB posters. Falls back to a warm
// film-grain panel when TMDB is not configured. Never fake div screenshots.
export async function PosterMosaic() {
  const trending = await getTrending();
  const posters = trending
    .map((m) => posterUrl(m.poster_path, "w342"))
    .filter((p): p is string => Boolean(p))
    .slice(0, 6);

  if (posters.length < 6) {
    return (
      <div
        className="relative h-full min-h-[420px] w-full overflow-hidden rounded-card"
        style={{
          backgroundColor: "var(--color-surface-2)",
          backgroundImage:
            "radial-gradient(rgba(28,24,18,0.08) 1px, transparent 1px)",
          backgroundSize: "4px 4px",
        }}
        aria-hidden
      />
    );
  }

  return (
    <div className="grid h-full grid-cols-3 gap-3" aria-hidden>
      {posters.map((src, i) => (
        <div
          key={src}
          className={`relative aspect-[2/3] overflow-hidden rounded-input bg-surface-2 shadow-warm ${
            i % 2 === 1 ? "translate-y-5" : ""
          }`}
        >
          <Image src={src} alt="" fill className="object-cover" sizes="180px" />
        </div>
      ))}
    </div>
  );
}
