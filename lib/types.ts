// Shared types for the identify pipeline and where-to-watch UI.

export type IdentifyMode = "identify" | "recommend";

// Movies and TV series are both identifiable.
export type MediaType = "movie" | "tv";

// Raw candidate shape returned by the Gemini reasoning layer.
export interface LlmCandidate {
  title: string;
  year: number;
  mediaType: MediaType;
  confidence: number;
  reasoning: string;
}

export type WatchOptionType = "flatrate" | "free" | "rent" | "buy";

export interface WatchOption {
  type: WatchOptionType;
  providerName: string;
  logoUrl: string | null;
  // Deep link when Watchmode supplies one, otherwise the TMDB watch page.
  link: string;
  price: number | null;
  format: string | null;
}

export interface WatchData {
  country: string;
  // The TMDB watch page is always a safe, legal fallback deep link.
  tmdbWatchPage: string | null;
  flatrate: WatchOption[];
  free: WatchOption[];
  rent: WatchOption[];
  buy: WatchOption[];
}

// A fully resolved result: LLM reasoning fused with real TMDB metadata
// and assembled watch options.
export interface IdentifiedTitle {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  year: number | null;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  confidence: number;
  reasoning: string;
  watch: WatchData | null;
}

export interface IdentifyResponse {
  query: string;
  mode: IdentifyMode;
  country: string;
  grounded: boolean;
  results: IdentifiedTitle[];
}

export interface IdentifyError {
  error: string;
  // Set when the user hit the free daily limit so the client can show upgrade UI.
  limitReached?: boolean;
}
