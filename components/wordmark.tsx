import Link from "next/link";

// The Premise wordmark. Display serif, the single accent on the dot.
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`font-display text-2xl font-semibold tracking-tight text-ink ${className}`}
      aria-label="Premise home"
    >
      Premise<span className="text-accent">.</span>
    </Link>
  );
}
