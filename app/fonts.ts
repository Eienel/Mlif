import { Fraunces } from "next/font/google";
import { GeistSans } from "geist/font/sans";

// Display face. Apple New York is preferred at runtime via the CSS stack,
// Fraunces is the self-hosted cross-platform fallback so non-Apple devices match.
export const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-fallback",
  display: "swap",
});

// UI face. Apple SF is preferred at runtime, Geist is the self-hosted fallback.
// GeistSans already exposes a CSS variable we alias to --font-ui-fallback.
export const geist = GeistSans;
