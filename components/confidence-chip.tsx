// A small chip conveying match confidence. Uses weight and the accent, never
// a second hue, to stay inside the one-accent rule.
export function ConfidenceChip({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const label = confidence >= 0.75 ? "Strong match" : confidence >= 0.5 ? "Likely match" : "Possible match";
  const solid = confidence >= 0.75;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        solid ? "bg-accent text-white" : "bg-surface-2 text-ink"
      }`}
      title={`${pct}% confidence`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${solid ? "bg-white" : "bg-accent"}`}
        aria-hidden
      />
      {label}
    </span>
  );
}
