import "server-only";
import { cache } from "react";
import { db } from "./db";

/** A sale shared as a receipt. Ids are unguessable cuids; the creator chooses to share the link. */
export const getReceipt = cache(async (id: string) =>
  db.sale.findUnique({
    where: { id },
    select: {
      id: true,
      productNumber: true,
      productName: true,
      destination: true,
      amountCents: true,
      commissionCents: true,
      createdAt: true,
      creator: { select: { handle: true, displayName: true } },
    },
  }),
);
