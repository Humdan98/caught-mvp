"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCreator } from "@/lib/auth";
import { db } from "@/lib/db";
import { UploadError, resolveImageField } from "@/lib/uploads";
import { fieldErrors, productSchema } from "@/lib/validation";
import type { FormState } from "./result";

function refresh(handle: string) {
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/${handle}`, "layout");
}

/** Create (no id) or update (id) a product. Numbers are assigned here, never by the client. */
export async function saveProduct(_prev: FormState, form: FormData): Promise<FormState> {
  const { creator } = await requireCreator();
  const id = String(form.get("id") ?? "") || null;

  let imageUrl: string | null;
  try {
    imageUrl = await resolveImageField(form, "imageFile", "imageUrl", creator.id);
  } catch (e) {
    return { errors: { imageUrl: e instanceof UploadError ? e.message : "Upload failed" } };
  }

  const parsed = productSchema.safeParse({
    name: form.get("name"),
    description: form.get("description") ?? "",
    price: form.get("price"),
    commission: form.get("commission") ?? "",
    imageUrl,
    tiktokUrl: form.get("tiktokUrl"),
    amazonUrl: form.get("amazonUrl") ?? "",
    brandUrl: form.get("brandUrl") ?? "",
    status: form.get("status"),
    backupProductId: form.get("backupProductId") ?? "",
    isVisible: form.get("isVisible") === "on",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { price, commission, ...data } = parsed.data;

  if (data.backupProductId) {
    if (data.backupProductId === id) return { errors: { backupProductId: "A product can't be its own backup" } };
    const backup = await db.product.findFirst({
      where: { id: data.backupProductId, creatorId: creator.id },
      select: { id: true },
    });
    if (!backup) return { errors: { backupProductId: "Pick one of your products" } };
  }

  const fields = { ...data, priceCents: price, commissionBps: commission };

  try {
    if (id) {
      const res = await db.product.updateMany({ where: { id, creatorId: creator.id }, data: fields });
      if (res.count === 0) return { message: "Product not found." };
    } else {
      await db.$transaction(async (tx) => {
        // Atomic counter: concurrent creates can never get the same number, and deleted numbers are never reused.
        const { nextProductNumber } = await tx.creator.update({
          where: { id: creator.id },
          data: { nextProductNumber: { increment: 1 } },
          select: { nextProductNumber: true },
        });
        const top = await tx.product.findFirst({
          where: { creatorId: creator.id },
          orderBy: { sortOrder: "asc" },
          select: { sortOrder: true },
        });
        await tx.product.create({
          data: {
            ...fields,
            creatorId: creator.id,
            number: nextProductNumber - 1,
            sortOrder: (top?.sortOrder ?? 1) - 1, // newest first
          },
        });
      });
    }
  } catch (err) {
    console.error("saveProduct failed", err);
    return { message: "Couldn't save the product. Try again." };
  }

  refresh(creator.handle);
  redirect(`/dashboard/products?saved=1`);
}

export async function deleteProduct(form: FormData) {
  const { creator } = await requireCreator();
  const id = String(form.get("id") ?? "");
  await db.product.deleteMany({ where: { id, creatorId: creator.id } });
  refresh(creator.handle);
  redirect("/dashboard/products?deleted=1");
}

export async function toggleProductVisibility(form: FormData) {
  const { creator } = await requireCreator();
  const id = String(form.get("id") ?? "");
  const p = await db.product.findFirst({ where: { id, creatorId: creator.id }, select: { isVisible: true } });
  if (p) await db.product.update({ where: { id }, data: { isVisible: !p.isVisible } });
  refresh(creator.handle);
}

export async function toggleProductStatus(form: FormData) {
  const { creator } = await requireCreator();
  const id = String(form.get("id") ?? "");
  const p = await db.product.findFirst({ where: { id, creatorId: creator.id }, select: { status: true } });
  if (!p) return;
  const soldOut = p.status !== "SOLD_OUT";
  await db.product.update({
    where: { id },
    data: soldOut ? { status: "SOLD_OUT" } : { status: "AVAILABLE", backupProductId: null },
  });
  refresh(creator.handle);
  // Marking sold out without a backup is a dead end for viewers; send them to pick one.
  if (soldOut) redirect(`/dashboard/products/${id}?pickBackup=1`);
}

/** Swap a product with its neighbour in the storefront order. */
export async function moveProduct(form: FormData) {
  const { creator } = await requireCreator();
  const id = String(form.get("id") ?? "");
  const dir = form.get("dir") === "up" ? -1 : 1;
  const rows = await db.product.findMany({
    where: { creatorId: creator.id },
    orderBy: [{ sortOrder: "asc" }, { number: "desc" }],
    select: { id: true },
  });
  const i = rows.findIndex((r) => r.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= rows.length) return;
  [rows[i], rows[j]] = [rows[j], rows[i]];
  // Renumber densely so sortOrder never drifts into ties.
  await db.$transaction(rows.map((r, idx) => db.product.update({ where: { id: r.id }, data: { sortOrder: idx } })));
  refresh(creator.handle);
}
