import { cn } from "@/components/ui/cn";

export function Stat({
  label,
  value,
  sub,
  delta,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  delta?: { current: number; previous: number; days: number };
  className?: string;
}) {
  let deltaText: string | null = null;
  if (delta) {
    if (delta.previous === 0) deltaText = delta.current > 0 ? "new" : null;
    else {
      const pct = Math.round(((delta.current - delta.previous) / delta.previous) * 100);
      deltaText = `${pct >= 0 ? "+" : ""}${pct}% vs prior ${delta.days}d`;
    }
  }
  return (
    <div className={cn("sheet p-4", className)}>
      <p className="label">{label}</p>
      <p className="num mt-1.5 text-[26px] leading-none font-semibold">{value}</p>
      <div className="mt-2 space-y-0.5 text-[12px] text-muted">
        {sub && <p>{sub}</p>}
        {deltaText && <p className="num">{deltaText}</p>}
      </div>
    </div>
  );
}
