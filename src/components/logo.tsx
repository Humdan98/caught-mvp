import { cn } from "./ui/cn";

export function Logo({ className, mark = true }: { className?: string; mark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[17px] font-semibold tracking-tight", className)}>
      {mark && (
        <span aria-hidden className="num grid size-6 place-items-center rounded-md bg-ink text-[13px] font-bold text-paper">
          #
        </span>
      )}
      Caught
    </span>
  );
}
