"use server";

import { redirect } from "next/navigation";
import { SANDBOX_MODE } from "@/lib/constants";
import { db } from "@/lib/db";

/**
 * Stands in for the affiliate network's conversion postback. One sale per click.
 * Commission = price × the product's commission rate.
 */
export async function simulatePurchase(form: FormData) {
  // Only exists in sandbox mode; in production real sales come from the affiliate networks.
  if (!SANDBOX_MODE) redirect("/");
  const clickId = String(form.get("clickId") ?? "");
  const click = await db.clickEvent.findUnique({
    where: { id: clickId },
    include: { product: { select: { id: true, priceCents: true, commissionBps: true } }, sale: true },
  });
  if (!click) redirect("/");
  if (!click.sale && click.product) {
    const amountCents = click.product.priceCents;
    await db.sale
      .create({
        data: {
          creatorId: click.creatorId,
          productId: click.product.id,
          clickId: click.id,
          productNumber: click.productNumber,
          productName: click.productName,
          destination: click.destination,
          amountCents,
          commissionCents: Math.round((amountCents * click.product.commissionBps) / 10_000),
        },
      })
      .catch(() => {}); // unique(clickId) — a double tap is harmless
  }
  redirect(`/sandbox/checkout?click=${click.id}`);
}
