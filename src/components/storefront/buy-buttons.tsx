import { ArrowUpRight } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import type { ClickSource } from "@/lib/constants";
import type { PublicProduct } from "@/lib/storefront";

/**
 * Purchase buttons. Plain <a> on purpose: Next <Link> would prefetch /go and log fake clicks.
 * TikTok Shop is always primary because that is where the creator's commission is highest.
 */
export function BuyButtons({
  product,
  source,
  videoId,
  compact,
}: {
  product: PublicProduct;
  source: ClickSource;
  videoId?: string | null;
  compact?: boolean;
}) {
  const href = (to: string) => {
    const params = new URLSearchParams({ to, src: source });
    if (videoId) params.set("v", videoId);
    return `/go/${product.id}?${params}`;
  };
  const secondary = [
    product.hasAmazon && { to: "amazon", label: "Amazon" },
    product.hasBrand && { to: "brand", label: "Brand site" },
  ].filter(Boolean) as { to: string; label: string }[];

  return (
    <div className="space-y-2">
      <a href={href("tiktok")} rel="nofollow" className={buttonClass("primary", compact ? "md" : "lg", "w-full")}>
        Buy on TikTok Shop
        <ArrowUpRight className="size-4" aria-hidden />
      </a>
      {secondary.length > 0 && (
        <div className={cn("grid gap-2", secondary.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
          {secondary.map((s) => (
            <a key={s.to} href={href(s.to)} rel="nofollow" className={buttonClass("secondary", compact ? "sm" : "md", "w-full")}>
              {s.label}
              <ArrowUpRight className="size-3.5 opacity-60" aria-hidden />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
