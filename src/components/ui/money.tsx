import { formatPrice } from "@/lib/format";
import { cn } from "./cn";

/** Money that was earned. The only place the brand green appears. */
export function Earned({ cents, className }: { cents: number; className?: string }) {
  return <span className={cn("num text-money", className)}>{formatPrice(cents)}</span>;
}

/** A price or a neutral amount (not earned). */
export function Price({ cents, className }: { cents: number; className?: string }) {
  return <span className={cn("num", className)}>{formatPrice(cents)}</span>;
}
