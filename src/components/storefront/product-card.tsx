import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { Price } from "@/components/ui/money";
import type { PublicProduct } from "@/lib/storefront";
import { LinkPending } from "./link-pending";

export function ProductCard({ product, href }: { product: PublicProduct; href: string }) {
  return (
    <Link href={href} className="group relative block overflow-hidden rounded-xl border border-line bg-sheet transition-colors hover:border-ink/30">
      <div className="relative">
        <ProductImage src={product.imageUrl} alt={product.name} number={product.number} soldOut={product.soldOut} className="aspect-square" />
        <span className="num absolute top-2 left-2 rounded-md bg-ink px-1.5 py-0.5 text-[12px] font-medium text-paper">
          #{product.number}
        </span>
      </div>
      <div className="px-3 pt-2.5 pb-3">
        <p className="line-clamp-2 min-h-[2.5em] text-[13.5px] leading-tight font-medium">{product.name}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <Price cents={product.priceCents} className="text-[13px] text-ink-2" />
          {product.soldOut && <span className="text-[11px] font-medium text-muted">Sold out</span>}
        </div>
      </div>
      <LinkPending />
    </Link>
  );
}
