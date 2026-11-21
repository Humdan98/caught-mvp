"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProductImage } from "@/components/product-image";
import { cn } from "@/components/ui/cn";
import { Price } from "@/components/ui/money";
import { searchProducts } from "@/lib/search";
import type { PublicProduct, PublicVideo } from "@/lib/storefront";
import { BuyButtons } from "./buy-buttons";
import { LinkPending } from "./link-pending";
import { ProductCard } from "./product-card";
import { VideoTile } from "./video-tile";

type Tab = "products" | "videos";

export function StorefrontView({
  creatorId,
  handle,
  displayName,
  products,
  videos,
  initialQuery,
}: {
  creatorId: string;
  handle: string;
  displayName: string;
  products: PublicProduct[];
  videos: PublicVideo[];
  initialQuery: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [tab, setTab] = useState<Tab>(videos.length > 0 && products.length === 0 ? "videos" : "products");
  const inputRef = useRef<HTMLInputElement>(null);
  const lastLogged = useRef<string>("");

  const { exact, results } = useMemo(() => searchProducts(products, query), [products, query]);
  const hasText = query.trim().length > 0;
  // A lone "#" (mid-way through typing "#47") isn't a search yet: keep the grid, log nothing.
  const searching = /[\p{L}\p{N}]/u.test(query);

  // Log a search once the viewer pauses typing. No-result queries tell the creator what to link next.
  function logSearch(q: string, count: number) {
    const normalized = q.trim().toLowerCase();
    if (!normalized || normalized === lastLogged.current) return;
    lastLogged.current = normalized;
    fetch("/api/events/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ creatorId, query: q.trim(), resultCount: count }),
      keepalive: true,
    }).catch(() => {});
  }

  useEffect(() => {
    if (!searching) return;
    const t = setTimeout(() => logSearch(query, results.length), 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, results.length, searching]);

  // Keep ?q= in the URL so a search can be shared or survives a back-navigation.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (query.trim()) url.searchParams.set("q", query.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  }, [query]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searching) return;
    logSearch(query, results.length);
    const target = exact ?? (results.length === 1 ? results[0] : null);
    if (target) router.push(`/${handle}/${target.number}?src=search`);
    else inputRef.current?.blur(); // hide the keyboard so results are visible
  }

  return (
    <div>
      {/* Search: the one thing most visitors came to do. */}
      <div className="sticky top-0 z-20 border-b border-line/70 bg-paper/95 px-5 py-3 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
        <form role="search" onSubmit={onSubmit} className="relative">
          <label htmlFor="q" className="sr-only">
            Search by product number or name
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted" aria-hidden />
          <input
            ref={inputRef}
            id="q"
            type="search"
            enterKeyHint="go"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Number from the video, like 47"
            className="h-12 w-full rounded-xl border border-ink/15 bg-sheet pr-11 pl-10 text-[16px] placeholder:text-faint focus:border-ink focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {hasText && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-ink/5"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </form>
      </div>

      {searching ? (
        <section aria-live="polite" className="px-5 pt-4 pb-10">
          {exact && (
            <div className="sheet mb-4 animate-fade-up overflow-hidden">
              <Link href={`/${handle}/${exact.number}?src=search`} className="relative flex gap-3 p-3">
                <ProductImage src={exact.imageUrl} alt={exact.name} number={exact.number} soldOut={exact.soldOut} className="size-20 shrink-0 rounded-lg" eager />
                <div className="min-w-0 flex-1">
                  <p className="label">Match</p>
                  <p className="mt-0.5 flex items-baseline gap-2">
                    <span className="num text-lg font-semibold">#{exact.number}</span>
                    <Price cents={exact.priceCents} className="text-sm text-muted" />
                  </p>
                  <p className="line-clamp-2 text-[14px] leading-snug font-medium">{exact.name}</p>
                </div>
                <LinkPending />
              </Link>
              <div className="rule mx-3" />
              <div className="p-3">
                {exact.soldOut ? (
                  <Link
                    href={`/${handle}/${exact.number}?src=search`}
                    className="block rounded-lg bg-paper-2 px-3 py-2.5 text-center text-sm font-medium"
                  >
                    Sold out — see what {displayName.split(" ")[0]} recommends instead →
                  </Link>
                ) : (
                  <BuyButtons product={exact} source="search" compact />
                )}
              </div>
            </div>
          )}

          {results.filter((p) => p !== exact).length > 0 && (
            <>
              <p className="label mb-2">{exact ? "Also matching" : `${results.length} ${results.length === 1 ? "result" : "results"}`}</p>
              <ul className="divide-y divide-dashed divide-ink/15 rounded-xl border border-line bg-sheet">
                {results
                  .filter((p) => p !== exact)
                  .map((p) => (
                    <li key={p.id}>
                      <Link href={`/${handle}/${p.number}?src=search`} className="relative flex items-center gap-3 px-3 py-2.5 hover:bg-ink/[0.02]">
                        <ProductImage src={p.imageUrl} alt="" number={p.number} soldOut={p.soldOut} className="size-12 shrink-0 rounded-md" />
                        <span className="num w-10 shrink-0 text-sm font-semibold">#{p.number}</span>
                        <span className="min-w-0 flex-1 truncate text-[14px]">{p.name}</span>
                        <Price cents={p.priceCents} className="text-[13px] text-muted" />
                        <LinkPending />
                      </Link>
                    </li>
                  ))}
              </ul>
            </>
          )}

          {results.length === 0 && (
            <div className="rounded-xl border border-dashed border-ink/20 px-5 py-8 text-center">
              <p className="font-medium">Nothing matches “{query.trim()}”.</p>
              <p className="mt-1 text-sm text-muted">
                Try the number said in the video, or a word from the product name. {displayName.split(" ")[0]} can see searches
                that came up empty.
              </p>
              <button type="button" onClick={() => setQuery("")} className="mt-4 text-sm font-medium underline underline-offset-4">
                Browse everything
              </button>
            </div>
          )}
        </section>
      ) : (
        <section className="pb-10">
          <div className="flex gap-6 border-b border-line px-5" role="tablist">
            {(
              [
                ["products", "Products", products.length],
                ["videos", "Videos", videos.length],
              ] as const
            ).map(([key, label, count]) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={cn(
                  "-mb-px flex h-11 items-center gap-1.5 border-b-2 text-[14px] font-medium transition-colors",
                  tab === key ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink",
                )}
              >
                {label}
                <span className="num text-[12px] text-faint">{count}</span>
              </button>
            ))}
          </div>

          <div className="px-5 pt-4">
            {tab === "products" ? (
              products.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">No products yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} href={`/${handle}/${p.number}?src=grid`} />
                  ))}
                </div>
              )
            ) : videos.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted">No videos yet.</p>
            ) : (
              <>
                <p className="mb-3 text-[13px] text-muted">Tap a video to get its product.</p>
                <div className="grid grid-cols-3 gap-2">
                  {videos.map((v) => (
                    <VideoTile key={v.id} video={v} handle={handle} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
