"use server";

import { db } from "@/lib/db";
import { notifySchema } from "@/lib/validation";

export type NotifyState = { ok: boolean; error?: string; contactType?: "email" | "phone" };

/** "Text me when it's on sale" — no SMS/email is sent; the creator sees the list in the dashboard. */
export async function notifyMe(_prev: NotifyState, form: FormData): Promise<NotifyState> {
  const parsed = notifySchema.safeParse({
    productId: form.get("productId"),
    contact: form.get("contact"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check that and try again" };

  const product = await db.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true, creatorId: true, status: true, isVisible: true },
  });
  if (!product || !product.isVisible) return { ok: false, error: "This product is no longer listed" };

  const { contact, contactType } = parsed.data.contact;
  try {
    await db.notificationSignup.upsert({
      where: { productId_contact: { productId: product.id, contact } },
      create: {
        creatorId: product.creatorId,
        productId: product.id,
        contact,
        contactType,
        reason: product.status === "SOLD_OUT" ? "restock" : "sale",
      },
      update: {}, // already signed up: treat as success, don't create a duplicate
    });
  } catch (err) {
    console.error("notifyMe failed", err);
    return { ok: false, error: "Couldn't save that. Try again in a moment." };
  }
  return { ok: true, contactType };
}
