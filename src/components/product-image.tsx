import { cn } from "./ui/cn";

/** Product image with a receipt-style fallback when none is set. */
export function ProductImage({
  src,
  alt,
  number,
  className,
  soldOut,
  eager,
}: {
  src: string | null;
  alt: string;
  number: number;
  className?: string;
  soldOut?: boolean;
  eager?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-paper-2", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className={cn("size-full object-cover", soldOut && "opacity-55 grayscale")}
        />
      ) : (
        <div className="num grid size-full place-items-center text-3xl text-faint">#{number}</div>
      )}
      {soldOut && (
        <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 -rotate-6 text-center">
          <span className="inline-block border-2 border-ink bg-paper/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.18em]">
            Sold out
          </span>
        </span>
      )}
    </div>
  );
}
