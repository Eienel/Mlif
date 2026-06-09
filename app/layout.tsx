import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { fraunces, geist } from "./fonts";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Premise — Describe it. Find it. Watch it.",
    template: "%s — Premise",
  },
  description:
    "Describe a movie from a vague memory and Premise identifies it, then shows where to watch: subscription, rent or buy, and legal free ad-supported platforms.",
  openGraph: {
    title: "Premise",
    description: "Describe it. Find it. Watch it.",
    url: siteUrl,
    siteName: "Premise",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f3ed",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${geist.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
