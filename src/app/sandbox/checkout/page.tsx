import { ArrowLeft, ArrowUpRight, FlaskConical } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductImage } from "@/components/product-image";
import { buttonClass } from "@/components/ui/button";
import { Earned, Price } from "@/components/ui/money";
import { SubmitButton } from "@/components/ui/submit-button";
import { DESTINATION_LABEL, SANDBOX_MODE, type Destination } from "@/lib/constants";
import { db } from "@/lib/db";
import { simulatePurchase } from "./actions";

export const metadata: Metadata = { title: "Sandbox checkout", robots: { index: false } };

export default async function SandboxCheckout({ searchParams }: { searchParams: Promise<{ click?: string }> }) {
  const { click: clickId } = await searchParams;
  if (!SANDBOX_MODE || !clickId) notFound();
  const click = await db.clickEvent.findUnique({
    where: { id: clickId },
    include: {
      creator: { select: { handle: true } },
      product: {
        select: { imageUrl: true, priceCents: true, tiktokUrl: true, amazonUrl: true, brandUrl: true, number: true },
      },
      sale: true,
    },
  });
  if (!click) notFound();

  const dest = click.destination as Destination;
  const store = DESTINATION_LABEL[dest];
  const realUrl =
    dest === "AMAZON" ? click.product?.amazonUrl : dest === "BRAND" ? click.product?.brandUrl : click.product?.tiktokUrl;

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 py-6">
      <div className="flex items-start gap-3 rounded-xl border border-dashed border-ink/30 px-4 py-3">
        <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
        <div className="min-w-0 text-[13px] leading-relaxed">
          <p className="font-semibold">Sandbox: pretend this is {store}.</p>
          <p className="text-muted">
            Your click was recorded. In production the viewer goes straight to{" "}
            <span className="num break-all text-ink-2">{realUrl ?? "the store"}</span>
          </p>
        </div>
      </div>

      <div className="sheet mt-5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="text-sm font-semibold">{store}</span>
          <span className="label">Checkout</span>
        </div>
        <div className="flex gap-3 p-4">
          <ProductImage
            src={click.product?.imageUrl ?? null}
            alt=""
            number={click.productNumber}
            className="size-20 shrink-0 rounded-lg"
          />
          <div className="min-w-0">
            <p className="text-[14px] leading-snug font-medium">{click.productName}</p>
            <p className="mt-1 text-[13px] text-muted">Qty 1</p>
            {click.product && <Price cents={click.product.priceCents} className="mt-1 block text-[15px]" />}
          </div>
        </div>

        <div className="rule mx-4" />
        <div className="p-4">
          {click.sale ? (
            <div className="space-y-1 text-center" role="status">
              <p className="text-sm text-muted">Order placed (simulated).</p>
              <p className="num text-lg font-semibold">
                Caught: <Earned cents={click.sale.commissionCents} /> from #{click.sale.productNumber}
              </p>
              <p className="text-[12px] text-muted">
                @{click.creator.handle} gets credit. It now shows in their dashboard.
              </p>
            </div>
          ) : click.product ? (
            <form action={simulatePurchase}>
              <input type="hidden" name="clickId" value={click.id} />
              <SubmitButton size="lg" className="w-full" pendingText="Placing order…">
                Place order (simulated)
              </SubmitButton>
            </form>
          ) : (
            <p className="text-center text-sm text-muted">This product was removed.</p>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Link href={`/${click.creator.handle}`} className={buttonClass("secondary", "md")}>
          <ArrowLeft className="size-4" aria-hidden /> @{click.creator.handle}
        </Link>
        {realUrl && (
          <a href={realUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("ghost", "md")}>
            Real link <ArrowUpRight className="size-4" aria-hidden />
          </a>
        )}
      </div>
    </main>
  );
}
