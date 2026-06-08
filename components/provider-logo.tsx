"use client";

import { useState } from "react";

// A provider logo that simply disappears if the image fails to load (flaky
// networks, missing files) instead of leaving a broken-image icon. Plain img so
// there is no domain allowlist or optimizer in the path.
export function ProviderLogo({ src, alt }: { src: string | null; alt: string }) {
  const [ok, setOk] = useState(true);
  if (!src || !ok) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={20}
      height={20}
      loading="lazy"
      onError={() => setOk(false)}
      className="h-5 w-5 rounded-[5px] object-cover"
    />
  );
}
