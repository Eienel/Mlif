import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <Wordmark />
      <p className="mt-8 font-display text-5xl font-semibold text-ink">Lost the plot.</p>
      <p className="mt-3 max-w-sm text-muted">
        That page does not exist. Try describing a film instead.
      </p>
      <Link
        href="/"
        className="mt-7 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Back home
      </Link>
    </div>
  );
}
