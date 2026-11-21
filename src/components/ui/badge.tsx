import { cn } from "./cn";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ink" | "outline" | "danger";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded px-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]",
        tone === "neutral" && "bg-ink/[0.07] text-ink-2",
        tone === "ink" && "bg-ink text-paper",
        tone === "outline" && "border border-ink/25 text-ink-2",
        tone === "danger" && "bg-danger/10 text-danger",
        className,
      )}
    >
      {children}
    </span>
  );
}
