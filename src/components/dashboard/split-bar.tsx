import { cn } from "@/components/ui/cn";

/** A horizontal proportion bar in ink tones (no colour = no implied money). */
const SHADES = ["bg-ink", "bg-ink/45", "bg-ink/15"];

export function SplitBar({ parts, className }: { parts: { label: string; value: number }[]; className?: string }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <div className={cn("flex h-2 w-full overflow-hidden rounded-full bg-ink/[0.06]", className)}>
      {total > 0 &&
        parts.map((p, i) => (
          <div key={p.label} className={SHADES[i % SHADES.length]} style={{ width: `${(p.value / total) * 100}%` }} title={`${p.label}: ${p.value}`} />
        ))}
    </div>
  );
}

export const SPLIT_SWATCH = SHADES;
