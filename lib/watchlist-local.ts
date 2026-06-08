"use client";

// The watchlist lives entirely in the browser, so there is no signup and no
// server round trip. Saved titles persist in localStorage and sync across
// components and tabs via a storage event plus a custom in-page event.

export interface SavedTitle {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  savedAt: number;
}

const KEY = "premise.watchlist";
const EVENT = "premise:watchlist-changed";

function read(): SavedTitle[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedTitle[]) : [];
  } catch {
    return [];
  }
}

function write(list: SavedTitle[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list));
  // Notify listeners in this same tab; the native storage event covers others.
  window.dispatchEvent(new Event(EVENT));
}

export function getWatchlist(): SavedTitle[] {
  return read().sort((a, b) => b.savedAt - a.savedAt);
}

export function isSaved(tmdbId: number): boolean {
  return read().some((t) => t.tmdbId === tmdbId);
}

// Adds or removes a title. Returns the new saved state.
export function toggleSaved(item: Omit<SavedTitle, "savedAt">): boolean {
  const list = read();
  const exists = list.some((t) => t.tmdbId === item.tmdbId);
  if (exists) {
    write(list.filter((t) => t.tmdbId !== item.tmdbId));
    return false;
  }
  write([...list, { ...item, savedAt: Date.now() }]);
  return true;
}

export function removeSaved(tmdbId: number) {
  write(read().filter((t) => t.tmdbId !== tmdbId));
}

// Subscribe to watchlist changes from any source. Returns an unsubscribe fn.
export function subscribe(onChange: () => void): () => void {
  const handler = () => onChange();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
