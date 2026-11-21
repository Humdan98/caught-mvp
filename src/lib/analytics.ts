import "server-only";
import { DESTINATIONS, type ClickSource, type Destination } from "./constants";
import { db } from "./db";
import { resolveBackup } from "./products";

export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
const dayKey = (d: Date) => {
  const x = startOfDay(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

export type ActivityItem =
  | { kind: "sale"; at: Date; number: number; name: string; commissionCents: number; destination: string; handle: string; id: string }
  | { kind: "click"; at: Date; number: number; name: string; destination: string; handle: string }
  | { kind: "signup"; at: Date; number: number; contactType: string; reason: string; handle: string }
  | { kind: "search"; at: Date; query: string; handle: string };

/**
 * Everything on the Overview page, computed from recorded events only.
 * `creatorIds` is always derived from the session (never from the request).
 */
export async function getAnalytics(creatorIds: string[], days: RangeDays) {
  const now = new Date();
  const from = startOfDay(new Date(now.getTime() - (days - 1) * DAY));
  const prevFrom = new Date(from.getTime() - days * DAY);
  const inRange = { creatorId: { in: creatorIds }, createdAt: { gte: from } };
  const inPrev = { creatorId: { in: creatorIds }, createdAt: { gte: prevFrom, lt: from } };

  const [
    views,
    prevViews,
    clicks,
    prevClicks,
    sales,
    prevSales,
    zeroSearches,
    searchCount,
    signupsByProduct,
    newSignups,
    products,
    handles,
    recentSignups,
  ] = await Promise.all([
    db.pageView.findMany({ where: inRange, select: { createdAt: true } }),
    db.pageView.count({ where: inPrev }),
    db.clickEvent.findMany({
      where: inRange,
      select: { productId: true, productNumber: true, productName: true, destination: true, source: true, createdAt: true, creatorId: true },
      orderBy: { createdAt: "desc" },
    }),
    db.clickEvent.count({ where: inPrev }),
    db.sale.findMany({
      where: inRange,
      select: { id: true, productId: true, productNumber: true, productName: true, destination: true, amountCents: true, commissionCents: true, createdAt: true, creatorId: true },
      orderBy: { createdAt: "desc" },
    }),
    db.sale.aggregate({ where: inPrev, _sum: { commissionCents: true } }),
    db.searchEvent.findMany({
      where: { ...inRange, resultCount: 0 },
      select: { query: true, createdAt: true, creatorId: true },
      orderBy: { createdAt: "desc" },
    }),
    db.searchEvent.count({ where: inRange }),
    db.notificationSignup.groupBy({ by: ["productId"], where: { creatorId: { in: creatorIds } }, _count: true }),
    db.notificationSignup.count({ where: inRange }),
    db.product.findMany({
      where: { creatorId: { in: creatorIds } },
      select: { id: true, number: true, name: true, imageUrl: true, status: true, backupProductId: true, isVisible: true, creatorId: true },
    }),
    db.creator.findMany({ where: { id: { in: creatorIds } }, select: { id: true, handle: true } }),
    db.notificationSignup.findMany({
      where: inRange,
      select: { createdAt: true, contactType: true, reason: true, creatorId: true, product: { select: { number: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const handleOf = new Map(handles.map((h) => [h.id, h.handle]));
  const productById = new Map(products.map((p) => [p.id, p]));
  const multi = creatorIds.length > 1;

  // ---- Totals ---------------------------------------------------------------------------
  const commissionCents = sales.reduce((s, x) => s + x.commissionCents, 0);
  const gmvCents = sales.reduce((s, x) => s + x.amountCents, 0);
  const waiting = signupsByProduct.reduce((s, x) => s + x._count, 0);

  // ---- Daily series -----------------------------------------------------------------------
  const series = new Map<string, { date: string; visits: number; clicks: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(from.getTime() + i * DAY);
    series.set(dayKey(d), { date: dayKey(d), visits: 0, clicks: 0 });
  }
  for (const v of views) {
    const b = series.get(dayKey(v.createdAt));
    if (b) b.visits++;
  }
  for (const c of clicks) {
    const b = series.get(dayKey(c.createdAt));
    if (b) b.clicks++;
  }

  // ---- Breakdowns -------------------------------------------------------------------------
  const byDestination = Object.fromEntries(DESTINATIONS.map((d) => [d, 0])) as Record<Destination, number>;
  const bySource: Record<string, number> = {};
  type Row = {
    key: string;
    productId: string | null;
    number: number;
    name: string;
    handle: string;
    imageUrl: string | null;
    soldOut: boolean;
    clicks: number;
    dest: Record<Destination, number>;
    sales: number;
    commissionCents: number;
    waiting: number;
  };
  const rows = new Map<string, Row>();
  const rowFor = (productId: string | null, number: number, name: string, creatorId: string) => {
    const key = productId ?? `deleted:${creatorId}:${number}`;
    let r = rows.get(key);
    if (!r) {
      const p = productId ? productById.get(productId) : undefined;
      r = {
        key,
        productId,
        number,
        name: p?.name ?? name,
        handle: handleOf.get(creatorId) ?? "",
        imageUrl: p?.imageUrl ?? null,
        soldOut: p?.status === "SOLD_OUT",
        clicks: 0,
        dest: { TIKTOK: 0, AMAZON: 0, BRAND: 0 },
        sales: 0,
        commissionCents: 0,
        waiting: 0,
      };
      rows.set(key, r);
    }
    return r;
  };

  for (const c of clicks) {
    const dest = c.destination as Destination;
    byDestination[dest] = (byDestination[dest] ?? 0) + 1;
    bySource[c.source] = (bySource[c.source] ?? 0) + 1;
    const r = rowFor(c.productId, c.productNumber, c.productName, c.creatorId);
    r.clicks++;
    r.dest[dest]++;
  }
  for (const s of sales) {
    const r = rowFor(s.productId, s.productNumber, s.productName, s.creatorId);
    r.sales++;
    r.commissionCents += s.commissionCents;
  }
  for (const w of signupsByProduct) {
    const p = productById.get(w.productId);
    if (!p) continue;
    rowFor(p.id, p.number, p.name, p.creatorId).waiting = w._count;
  }
  const productRows = [...rows.values()].sort((a, b) => b.clicks - a.clicks || b.waiting - a.waiting);

  // ---- Searches that found nothing ------------------------------------------------------------
  const missMap = new Map<string, { query: string; count: number; last: Date; handle: string }>();
  for (const s of zeroSearches) {
    const key = `${s.creatorId}:${s.query.trim().toLowerCase()}`;
    const m = missMap.get(key);
    if (m) m.count++;
    else missMap.set(key, { query: s.query.trim(), count: 1, last: s.createdAt, handle: handleOf.get(s.creatorId) ?? "" });
  }
  const misses = [...missMap.values()].sort((a, b) => b.count - a.count || b.last.getTime() - a.last.getTime());

  // ---- Needs attention ----------------------------------------------------------------------
  const waitingBy = new Map(signupsByProduct.map((w) => [w.productId, w._count]));
  const alerts = products
    .filter((p) => p.status === "SOLD_OUT" && p.isVisible)
    .map((p) => ({
      id: p.id,
      number: p.number,
      name: p.name,
      handle: handleOf.get(p.creatorId) ?? "",
      waiting: waitingBy.get(p.id) ?? 0,
      // What viewers actually get (follows chains, skips hidden/sold-out), not just the configured id.
      backupNumber: resolveBackup(p, productById)?.number ?? null,
    }))
    .sort((a, b) => Number(a.backupNumber !== null) - Number(b.backupNumber !== null) || b.waiting - a.waiting);

  // ---- Recent activity ----------------------------------------------------------------------
  const activity: ActivityItem[] = [
    ...sales.slice(0, 10).map((s) => ({
      kind: "sale" as const, at: s.createdAt, number: s.productNumber, name: s.productName,
      commissionCents: s.commissionCents, destination: s.destination, handle: handleOf.get(s.creatorId) ?? "", id: s.id,
    })),
    ...clicks.slice(0, 10).map((c) => ({
      kind: "click" as const, at: c.createdAt, number: c.productNumber, name: c.productName,
      destination: c.destination, handle: handleOf.get(c.creatorId) ?? "",
    })),
    ...recentSignups.map((s) => ({
      kind: "signup" as const, at: s.createdAt, number: s.product.number, contactType: s.contactType,
      reason: s.reason, handle: handleOf.get(s.creatorId) ?? "",
    })),
    ...zeroSearches.slice(0, 6).map((s) => ({
      kind: "search" as const, at: s.createdAt, query: s.query, handle: handleOf.get(s.creatorId) ?? "",
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 14);

  return {
    days,
    multi,
    totals: {
      visits: views.length,
      prevVisits: prevViews,
      clicks: clicks.length,
      prevClicks,
      sales: sales.length,
      gmvCents,
      commissionCents,
      prevCommissionCents: prevSales._sum.commissionCents ?? 0,
      waiting,
      newSignups,
      searches: searchCount,
      zeroSearches: zeroSearches.length,
    },
    series: [...series.values()],
    byDestination,
    bySource: bySource as Partial<Record<ClickSource, number>>,
    productRows,
    misses,
    alerts,
    activity,
  };
}

export type Analytics = Awaited<ReturnType<typeof getAnalytics>>;
