import { cn } from "./cn";

/** The product number, styled like a receipt line item. */
export function NumTag({ n, className, size = "sm" }: { n: number; className?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      className={cn(
        "num inline-flex items-center font-medium",
        size === "sm" && "text-[12px]",
        size === "md" && "text-sm",
        size === "lg" && "text-2xl",
        className,
      )}
    >
      #{n}
    </span>
  );
}
