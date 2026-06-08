// A short list of well-supported regions for the country selector. Watchmode's
// free tier covers up to three countries, so this stays intentionally compact.
export const COUNTRIES: { code: string; name: string }[] = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
];

export const DEFAULT_COUNTRY = "US";

export function isSupportedCountry(code: string): boolean {
  return COUNTRIES.some((c) => c.code === code.toUpperCase());
}
