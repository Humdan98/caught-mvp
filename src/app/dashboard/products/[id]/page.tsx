import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProductForm } from "@/components/dashboard/product-form";
import { buttonClass } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { requireCreator } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteProduct } from "../../_actions/products";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pickBackup?: string }>;
}) {
  const { creator } = await requireCreator();
  const { id } = await params;
  const { pickBackup } = await searchParams;
  // Scoped by creator: another creator's product id is a 404, not a leak.
  const product = await db.product.findFirst({ where: { id, creatorId: creator.id } });
  if (!product) notFound();
  const [options, videoCount, signupCount] = await Promise.all([
    db.product.findMany({
      where: { creatorId: creator.id, id: { not: id } },
      orderBy: { number: "desc" },
      select: { id: true, number: true, name: true, status: true, isVisible: true },
    }),
    db.video.count({ where: { productId: id } }),
    db.notificationSignup.count({ where: { productId: id } }),
  ]);

  return (
    <>
      <PageHeader
        title={`#${product.number} ${product.name}`}
        description={`${videoCount} linked ${videoCount === 1 ? "video" : "videos"} · ${signupCount} waiting for a text`}
        actions={
          product.isVisible && (
            <a href={`/${creator.handle}/${product.number}`} target="_blank" rel="noopener" className={buttonClass("secondary", "sm")}>
              View on page <ExternalLink className="size-3.5" aria-hidden />
            </a>
          )
        }
      />
      {pickBackup && (
        <div className="sheet mb-5 p-4 text-sm">
          <p className="font-semibold">#{product.number} is now sold out.</p>
          <p className="text-muted">Pick a backup so viewers from your old videos still have something to buy.</p>
        </div>
      )}
      <ProductForm
        focusBackup={!!pickBackup}
        backupOptions={options.map((o) => ({ id: o.id, number: o.number, name: o.name, soldOut: o.status === "SOLD_OUT", hidden: !o.isVisible }))}
        initial={{
          id: product.id,
          number: product.number,
          name: product.name,
          description: product.description,
          price: (product.priceCents / 100).toFixed(2),
          commission: String(product.commissionBps / 100),
          imageUrl: product.imageUrl,
          tiktokUrl: product.tiktokUrl,
          amazonUrl: product.amazonUrl ?? "",
          brandUrl: product.brandUrl ?? "",
          status: product.status === "SOLD_OUT" ? "SOLD_OUT" : "AVAILABLE",
          backupProductId: product.backupProductId ?? "",
          isVisible: product.isVisible,
        }}
      />
      <section className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/25 p-5">
        <div>
          <p className="font-semibold">Delete product</p>
          <p className="text-sm text-muted">
            Removes it and its sign-ups. Click history stays in analytics. <span className="num">#{product.number}</span> won&apos;t be given to another product.
          </p>
        </div>
        <form action={deleteProduct}>
          <input type="hidden" name="id" value={product.id} />
          <ConfirmButton>Delete #{product.number}</ConfirmButton>
        </form>
      </section>
    </>
  );
}
