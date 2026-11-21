import "server-only";
import { cache } from "react";
import { db } from "./db";
import { resolveBackup } from "./products";

/** Shape sent to the browser. Destination URLs stay on the server (see /go). */
export type PublicProduct = {
  id: string;
  number: number;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  soldOut: boolean;
  hasAmazon: boolean;
  hasBrand: boolean;
};

export type PublicVideo = {
  id: string;
  caption: string;
  thumbnailUrl: string | null;
  tiktokUrl: string;
  productNumber: number | null;
};

const productSelect = {
  id: true,
  number: true,
  name: true,
  description: true,
  priceCents: true,
  imageUrl: true,
  status: true,
  isVisible: true,
  backupProductId: true,
  amazonUrl: true,
  brandUrl: true,
} as const;

type Row = {
  id: string;
  number: number;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  status: string;
  isVisible: boolean;
  backupProductId: string | null;
  amazonUrl: string | null;
  brandUrl: string | null;
};

export function toPublicProduct(p: Row): PublicProduct {
  return {
    id: p.id,
    number: p.number,
    name: p.name,
    description: p.description,
    priceCents: p.priceCents,
    imageUrl: p.imageUrl,
    soldOut: p.status === "SOLD_OUT",
    hasAmazon: !!p.amazonUrl,
    hasBrand: !!p.brandUrl,
  };
}

export const getStorefront = cache(async (handle: string) => {
  const creator = await db.creator.findUnique({
    where: { handle: handle.toLowerCase() },
    select: {
      id: true,
      handle: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      socials: { orderBy: { sortOrder: "asc" }, select: { id: true, platform: true, url: true } },
      products: {
        where: { isVisible: true },
        orderBy: [{ sortOrder: "asc" }, { number: "desc" }],
        select: productSelect,
      },
      videos: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          caption: true,
          thumbnailUrl: true,
          tiktokUrl: true,
          product: { select: { number: true, isVisible: true } },
        },
      },
    },
  });
  if (!creator) return null;

  const videos: PublicVideo[] = creator.videos.map((v) => ({
    id: v.id,
    caption: v.caption,
    thumbnailUrl: v.thumbnailUrl,
    tiktokUrl: v.tiktokUrl,
    productNumber: v.product?.isVisible ? v.product.number : null,
  }));

  return { creator, rows: creator.products, products: creator.products.map(toPublicProduct), videos };
});

/** Product page data: the product, plus a buyable backup if it is sold out. */
export const getProductPage = cache(async (handle: string, number: number) => {
  const store = await getStorefront(handle);
  if (!store) return null;
  const row = store.rows.find((p) => p.number === number);
  if (!row) return { store, product: null, backup: null };
  const byId = new Map(store.rows.map((p) => [p.id, p]));
  const backupRow = row.status === "SOLD_OUT" ? resolveBackup(row, byId) : null;
  return {
    store,
    product: toPublicProduct(row),
    backup: backupRow ? toPublicProduct(backupRow) : null,
  };
});
