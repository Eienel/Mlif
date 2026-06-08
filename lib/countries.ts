// The regions Premise supports. Watchmode's free tier returns sources for only
// the three regions configured in the account, so this list must match them
// exactly: United States, Canada, India.
export const COUNTRIES: { code: string; name: string }[] = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "IN", name: "India" },
];

export const DEFAULT_COUNTRY = "US";

export function isSupportedCountry(code: string): boolean {
  return COUNTRIES.some((c) => c.code === code.toUpperCase());
}
