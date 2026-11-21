import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { ProductImage } from "@/components/product-image";
import { BuyButtons } from "@/components/storefront/buy-buttons";
import { NotifyForm } from "@/components/storefront/notify-form";
import { StoreFooter } from "@/components/storefront/store-footer";
import { VisitTracker } from "@/components/storefront/visit-tracker";
import { Price } from "@/components/ui/money";
import { CLICK_SOURCES, type ClickSource } from "@/lib/constants";
import { db } from "@/lib/db";
import { getProductPage } from "@/lib/storefront";

type Props = {
  params: Promise<{ handle: string; number: string }>;
  searchParams: Promise<{ v?: string; src?: string }>;
};

function safeDecode(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function parseNumber(raw: string): number | null {
  const m = safeDecode(raw).trim().match(/^#?(\d{1,6})$/);
  const n = m ? Number(m[1]) : 0;
  return n > 0 ? n : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, number } = await params;
  const n = parseNumber(number);
  const data = n ? await getProductPage(handle, n) : null;
  if (!data?.product) return { title: "Not found" };
  return { title: `#${data.product.number} ${data.product.name} · @${data.store.creator.handle}` };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { handle, number } = await params;
  const { v, src } = await searchParams;
  const n = parseNumber(number);
  // "/maya/lipoil" isn't a number: treat it as a search on the creator's page.
  if (n === null) redirect(`/${encodeURIComponent(handle)}?q=${encodeURIComponent(safeDecode(number).slice(0, 100))}`);
  const data = await getProductPage(handle, n);
  if (!data) notFound();

  const { store, product, backup } = data;
  const { creator } = store;
  const firstName = creator.displayName.split(" ")[0];
  const video = v ? store.videos.find((x) => x.id === v) : undefined;
  const source: ClickSource = video
    ? "video"
    : CLICK_SOURCES.includes(src as ClickSource)
      ? (src as ClickSource)
      : "direct";

  if (!product) {
    // A dead number (e.g. from an old video) is exactly what the creator needs to hear about.
    after(() =>
      db.searchEvent
        .create({ data: { creatorId: creator.id, query: `#${n}`, resultCount: 0 } })
        .catch(() => {}),
    );
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col">
        <TopBar handle={creator.handle} />
        <div className="px-5 py-12 text-center">
          <p className="num text-4xl font-semibold">#{n}</p>
          <h1 className="mt-3 text-lg font-semibold">That number isn&apos;t listed right now.</h1>
          <p className="mt-1 text-sm text-muted">{firstName} may have removed it. Search the rest of the shop:</p>
          <Link
            href={`/${creator.handle}`}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-ink px-5 text-sm font-medium text-paper"
          >
            See all of @{creator.handle} <ArrowRight className="size-4" />
          </Link>
        </div>
        <StoreFooter />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col">
      <VisitTracker creatorId={creator.id} />
      <TopBar handle={creator.handle} number={product.number} />

      {video && (
        <div className="mx-5 mb-4 flex items-center gap-3 rounded-xl border border-line bg-sheet p-2 pr-3">
          {video.thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={video.thumbnailUrl} alt="" className="h-14 w-10 shrink-0 rounded object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <p className="label">From the video</p>
            <p className="truncate text-[13px] text-ink-2">{video.caption}</p>
          </div>
          <a
            href={video.tiktokUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-[12px] font-medium text-muted underline-offset-4 hover:underline"
          >
            Watch
          </a>
        </div>
      )}

      {product.soldOut && (
        <section className="mx-5 mb-5 animate-fade-up">
          <div className="rounded-t-xl bg-ink px-4 py-3 text-paper">
            <p className="text-[15px] font-semibold">
              <span className="num">#{product.number}</span> is sold out.
            </p>
            <p className="text-[13px] text-paper/70">
              {backup
                ? `${firstName} recommends this instead.`
                : `Leave your number and you'll hear when it's back.`}
            </p>
          </div>
          {backup ? (
            <div className="rounded-b-xl border border-t-0 border-line bg-sheet p-3">
              <Link href={`/${creator.handle}/${backup.number}?src=backup`} className="flex gap-3">
                <ProductImage
                  src={backup.imageUrl}
                  alt={backup.name}
                  number={backup.number}
                  className="size-20 shrink-0 rounded-lg"
                  eager
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline gap-2">
                    <span className="num font-semibold">#{backup.number}</span>
                    <Price cents={backup.priceCents} className="text-sm text-muted" />
                  </p>
                  <p className="line-clamp-2 text-[14px] leading-snug font-medium">{backup.name}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[12px] text-muted">
                    View details <ArrowRight className="size-3" />
                  </p>
                </div>
              </Link>
              <div className="rule my-3" />
              <BuyButtons product={backup} source="backup" videoId={video?.id} compact />
            </div>
          ) : (
            <div className="rounded-b-xl border border-t-0 border-line bg-sheet p-3">
              <NotifyForm productId={product.id} number={product.number} soldOut />
            </div>
          )}
        </section>
      )}

      <article className="px-5 pb-8">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          number={product.number}
          soldOut={product.soldOut}
          className={product.soldOut ? "aspect-[2/1] rounded-xl" : "aspect-square rounded-xl"}
          eager
        />

        <div className="sheet torn-bottom mt-4 rounded-b-none px-4 pt-4 pb-6">
          <div className="flex items-baseline justify-between">
            <span className="num text-2xl font-semibold">#{product.number}</span>
            <Price cents={product.priceCents} className="text-xl font-medium" />
          </div>
          <h1 className="mt-2 text-lg leading-snug font-semibold">{product.name}</h1>
          {product.description && (
            <p className="mt-2 text-[14.5px] leading-relaxed whitespace-pre-line text-ink-2">{product.description}</p>
          )}

          <div className="rule my-4" />

          {product.soldOut ? (
            backup && <NotifyForm productId={product.id} number={product.number} soldOut />
          ) : (
            <div className="space-y-3">
              <BuyButtons product={product} source={source} videoId={video?.id} />
              <NotifyForm productId={product.id} number={product.number} soldOut={false} />
            </div>
          )}

          {!product.soldOut && (
            <p className="mt-4 text-center text-[11.5px] text-faint">
              Buying through any of these supports @{creator.handle}. Prices can differ by store.
            </p>
          )}
        </div>
      </article>

      <StoreFooter />
    </main>
  );
}

function TopBar({ handle, number }: { handle: string; number?: number }) {
  return (
    <div className="flex h-14 items-center justify-between px-3">
      <Link
        href={`/${handle}`}
        className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-[14px] font-medium hover:bg-ink/5"
      >
        <ArrowLeft className="size-4" aria-hidden />
        <span className="num">@{handle}</span>
      </Link>
      {number !== undefined && (
        <Link
          href={`/${handle}`}
          className="inline-flex h-10 items-center gap-1 rounded-lg px-2 text-[13px] text-muted hover:bg-ink/5"
        >
          <Search className="size-3.5" aria-hidden /> Search shop
        </Link>
      )}
    </div>
  );
}
