import { ArrowDown, ArrowUp, Eye, EyeOff, Package, Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/dashboard/flash";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProductImage } from "@/components/product-image";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Price } from "@/components/ui/money";
import { requireCreator } from "@/lib/auth";
import { resolveBackup } from "@/lib/products";
import { db } from "@/lib/db";
import { plural } from "@/lib/format";
import { moveProduct, toggleProductStatus, toggleProductVisibility } from "../_actions/products";

export const metadata: Metadata = { title: "Products" };

const iconBtn = "grid size-8 place-items-center rounded-lg text-muted hover:bg-ink/[0.06] hover:text-ink disabled:opacity-30";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; welcome?: string }>;
}) {
  const { creator } = await requireCreator();
  const sp = await searchParams;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [products, clicks, waiting] = await Promise.all([
    db.product.findMany({
      where: { creatorId: creator.id },
      orderBy: [{ sortOrder: "asc" }, { number: "desc" }],
      include: { backupProduct: { select: { number: true } } },
    }),
    db.clickEvent.groupBy({ by: ["productId"], where: { creatorId: creator.id, createdAt: { gte: since } }, _count: true }),
    db.notificationSignup.groupBy({ by: ["productId"], where: { creatorId: creator.id }, _count: true }),
  ]);
  const clicksBy = new Map(clicks.map((c) => [c.productId, c._count]));
  const waitingBy = new Map(waiting.map((w) => [w.productId, w._count]));
  const byId = new Map(products.map((p) => [p.id, p]));

  const flash = sp.saved ? "Product saved." : sp.deleted ? "Product deleted. Its number won't be reused." : null;

  return (
    <>
      <PageHeader
        title="Products"
        description="Every product gets a number. Say it in your video; viewers type it on your page."
        actions={
          <ButtonLink href="/dashboard/products/new">
            <Plus className="size-4" aria-hidden /> Add product
          </ButtonLink>
        }
      />
      <Flash message={flash} />
      {sp.welcome && products.length === 0 && (
        <div className="sheet mb-6 p-5">
          <p className="font-semibold">Your page is live at caughtshop.com/{creator.handle}</p>
          <p className="mt-1 text-sm text-muted">
            Add the first product you&apos;re promoting. It becomes <span className="num">#1</span> — then say “it&apos;s #1 in my bio.”
          </p>
        </div>
      )}

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="size-7" />}
          title="No products yet"
          body="Add a product with its TikTok Shop link. Amazon and brand links are optional."
          action={<ButtonLink href="/dashboard/products/new">Add your first product</ButtonLink>}
        />
      ) : (
        <ul className="overflow-hidden rounded-xl border border-line bg-sheet">
          {products.map((p, i) => {
            const soldOut = p.status === "SOLD_OUT";
            return (
              <li key={p.id} className="flex items-center gap-3 border-b border-dashed border-ink/15 px-3 py-3 last:border-0 md:px-4">
                <div className="hidden flex-col sm:flex">
                  <form action={moveProduct}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="dir" value="up" />
                    <button className={iconBtn} disabled={i === 0} aria-label={`Move #${p.number} up`}>
                      <ArrowUp className="size-3.5" />
                    </button>
                  </form>
                  <form action={moveProduct}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="dir" value="down" />
                    <button className={iconBtn} disabled={i === products.length - 1} aria-label={`Move #${p.number} down`}>
                      <ArrowDown className="size-3.5" />
                    </button>
                  </form>
                </div>
                <Link href={`/dashboard/products/${p.id}`} className="shrink-0">
                  <ProductImage src={p.imageUrl} alt="" number={p.number} soldOut={soldOut} className={`size-14 rounded-lg ${!p.isVisible ? "opacity-40" : ""}`} />
                </Link>
                <Link href={`/dashboard/products/${p.id}`} className="min-w-0 flex-1">
                  <p className="flex items-baseline gap-2">
                    <span className="num font-semibold">#{p.number}</span>
                    <Price cents={p.priceCents} className="text-[13px] text-muted" />
                  </p>
                  <p className="truncate text-[14px]">{p.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {soldOut && <Badge tone="ink">Sold out</Badge>}
                    {soldOut && <BackupBadge configured={p.backupProduct?.number ?? null} effective={resolveBackup(p, byId)?.number ?? null} />}
                    {!p.isVisible && <Badge>Hidden</Badge>}
                    <span className="num text-[11.5px] text-muted">
                      {plural(clicksBy.get(p.id) ?? 0, "click")} · 30d
                      {waitingBy.get(p.id) ? ` · ${waitingBy.get(p.id)} waiting` : ""}
                    </span>
                  </div>
                </Link>
                <div className="flex items-center gap-0.5">
                  <form action={toggleProductStatus}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="hidden h-8 rounded-lg px-2.5 text-[12.5px] font-medium text-ink-2 hover:bg-ink/[0.06] md:block">
                      {soldOut ? "Mark available" : "Mark sold out"}
                    </button>
                  </form>
                  <form action={toggleProductVisibility}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className={iconBtn} aria-label={p.isVisible ? `Hide #${p.number}` : `Show #${p.number}`} title={p.isVisible ? "Hide from page" : "Show on page"}>
                      {p.isVisible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </button>
                  </form>
                  <Link href={`/dashboard/products/${p.id}`} className={iconBtn} aria-label={`Edit #${p.number}`}>
                    <Pencil className="size-4" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {products.length > 1 && (
        <p className="mt-3 text-[12px] text-muted">Order here is the order on your page. New products go to the top.</p>
      )}
    </>
  );
}

/** Shows where viewers of a sold-out product actually end up. */
function BackupBadge({ configured, effective }: { configured: number | null; effective: number | null }) {
  if (effective !== null && effective === configured) return <Badge tone="outline">Backup #{effective}</Badge>;
  if (effective !== null) return <Badge tone="outline">Backup #{configured} → #{effective}</Badge>;
  if (configured !== null) return <Badge tone="danger">Backup #{configured} unavailable</Badge>;
  return <Badge tone="danger">No backup</Badge>;
}
