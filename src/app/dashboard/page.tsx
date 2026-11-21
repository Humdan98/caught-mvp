import { AlertTriangle, ArrowRight, Bell, MousePointerClick, Plus, Receipt, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SPLIT_SWATCH, SplitBar } from "@/components/dashboard/split-bar";
import { Stat } from "@/components/dashboard/stat";
import { TrafficChart } from "@/components/dashboard/traffic-chart";
import { ProductImage } from "@/components/product-image";
import { cn } from "@/components/ui/cn";
import { EmptyState } from "@/components/ui/empty-state";
import { Earned, Price } from "@/components/ui/money";
import { RANGES, getAnalytics, type ActivityItem, type RangeDays } from "@/lib/analytics";
import { requireCreator } from "@/lib/auth";
import { DESTINATIONS, DESTINATION_LABEL, SOURCE_LABEL, type ClickSource, type Destination } from "@/lib/constants";
import { formatCount, formatPercent, plural, timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Overview" };

type SP = Promise<{ range?: string; scope?: string }>;

export default async function OverviewPage({ searchParams }: { searchParams: SP }) {
  const { creator, creators } = await requireCreator();
  const sp = await searchParams;
  const days = (RANGES.find((r) => String(r) === sp.range) ?? 30) as RangeDays;
  const all = sp.scope === "all" && creators.length > 1;
  // Scope comes from the session's own accounts only.
  const ids = all ? creators.map((c) => c.id) : [creator.id];
  const a = await getAnalytics(ids, days);
  const t = a.totals;
  const href = (p: { range?: number; scope?: string }) => {
    const q = new URLSearchParams();
    const r = p.range ?? days;
    if (r !== 30) q.set("range", String(r));
    const s = p.scope ?? (all ? "all" : "");
    if (s) q.set("scope", s);
    return `/dashboard${q.size ? `?${q}` : ""}`;
  };
  const totalClicks = t.clicks;
  const offTikTok = a.byDestination.AMAZON + a.byDestination.BRAND;
  const empty = t.visits === 0 && t.clicks === 0;

  return (
    <>
      <PageHeader
        title="Overview"
        description={
          <>
            <span className="num">{all ? `${creators.length} accounts combined` : `@${creator.handle}`}</span> · last {days} days
          </>
        }
        actions={
          <>
            {creators.length > 1 && (
              <Segmented
                items={[
                  { label: "This account", href: href({ scope: "" }), active: !all },
                  { label: `All ${creators.length}`, href: href({ scope: "all" }), active: all },
                ]}
              />
            )}
            <Segmented items={RANGES.map((r) => ({ label: `${r}d`, href: href({ range: r }), active: r === days }))} mono />
          </>
        }
      />

      {a.alerts.length > 0 && (
        <section className="mb-6 rounded-xl border border-ink/20 bg-sheet">
          {a.alerts.slice(0, 3).map((al) => (
            <Link
              key={al.id}
              href={`/dashboard/products/${al.id}`}
              className="flex items-center gap-3 border-b border-dashed border-ink/15 px-4 py-3 text-[13.5px] last:border-0 hover:bg-ink/[0.02]"
            >
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="num font-semibold">#{al.number}</span> is sold out
                {al.handle && all ? <span className="num text-muted"> (@{al.handle})</span> : null}.{" "}
                {al.backupNumber !== null ? (
                  <span className="text-muted">
                    Viewers are sent to <span className="num">#{al.backupNumber}</span>.
                  </span>
                ) : (
                  <span className="font-medium">No backup — viewers hit a dead end.</span>
                )}
                {al.waiting > 0 && <span className="text-muted"> {al.waiting} waiting for a restock text.</span>}
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted" aria-hidden />
            </Link>
          ))}
        </section>
      )}

      {empty ? (
        <EmptyState
          title="No visits yet"
          body="Put your Caught link in your TikTok bio and mention product numbers in your videos. Visits, clicks and sales show up here as they happen."
          action={
            <a href={`/${creator.handle}`} target="_blank" rel="noopener" className="text-sm font-medium underline underline-offset-4">
              Open your page
            </a>
          }
        />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 [&>*]:min-w-0">
            <Stat label="Page visits" value={formatCount(t.visits)} delta={{ current: t.visits, previous: t.prevVisits, days }} />
            <Stat
              label="Product clicks"
              value={formatCount(t.clicks)}
              sub={`${formatPercent(t.clicks, t.visits)} of visits`}
              delta={{ current: t.clicks, previous: t.prevClicks, days }}
            />
            <Stat
              label="Commission caught"
              value={<Earned cents={t.commissionCents} />}
              sub={
                <>
                  {plural(t.sales, "sale")} · <Price cents={t.gmvCents} /> GMV
                </>
              }
              delta={{ current: t.commissionCents, previous: t.prevCommissionCents, days }}
            />
            <Stat label="Waiting for a text" value={formatCount(t.waiting)} sub={`${t.newSignups} new in ${days}d`} />
          </section>

          <section className="mt-3 grid gap-3 lg:grid-cols-[1fr_320px] [&>*]:min-w-0">
            <div className="sheet flex flex-col p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Traffic</h2>
                <div className="flex items-center gap-4 text-[12px] text-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-ink" /> Clicks
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-0.5 w-3 bg-faint" /> Visits
                  </span>
                </div>
              </div>
              <div className="min-h-64 flex-1">
                <TrafficChart data={a.series} />
              </div>
            </div>

            <div className="sheet p-4">
              <h2 className="font-semibold">Where they chose to buy</h2>
              <p className="mt-0.5 text-[12.5px] text-muted">
                {totalClicks > 0
                  ? `${formatPercent(offTikTok, totalClicks)} of clicks skipped TikTok Shop. Without those links, those buyers had nowhere to go.`
                  : "No clicks in this period."}
              </p>
              <SplitBar className="mt-4" parts={DESTINATIONS.map((d) => ({ label: DESTINATION_LABEL[d], value: a.byDestination[d] }))} />
              <ul className="mt-4 space-y-2.5">
                {DESTINATIONS.map((d, i) => (
                  <li key={d} className="flex items-center gap-2 text-[13.5px]">
                    <span className={cn("size-2.5 rounded-sm", SPLIT_SWATCH[i])} />
                    <span className="flex-1">{DESTINATION_LABEL[d]}</span>
                    <span className="num">{formatCount(a.byDestination[d])}</span>
                    <span className="num w-10 text-right text-muted">{formatPercent(a.byDestination[d], totalClicks)}</span>
                  </li>
                ))}
              </ul>
              <div className="rule my-4" />
              <h3 className="label mb-2.5">How viewers found products</h3>
              <ul className="space-y-2">
                {(Object.entries(a.bySource) as [ClickSource, number][])
                  .sort((x, y) => y[1] - x[1])
                  .map(([src, n]) => (
                    <li key={src} className="text-[13px]">
                      <div className="flex justify-between">
                        <span>{SOURCE_LABEL[src] ?? src}</span>
                        <span className="num text-muted">{formatPercent(n, totalClicks)}</span>
                      </div>
                      <div className="mt-1 h-1 rounded-full bg-ink/[0.06]">
                        <div className="h-1 rounded-full bg-ink/60" style={{ width: `${(n / Math.max(1, totalClicks)) * 100}%` }} />
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          </section>

          <section className="sheet mt-3 overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <h2 className="font-semibold">Products</h2>
              <span className="text-[12px] text-muted">Sorted by clicks</span>
            </div>
            {a.productRows.length === 0 ? (
              <p className="px-4 pb-5 text-sm text-muted">No product activity in this period.</p>
            ) : (
              <>
              {/* Phones: one line per product */}
              <ul className="border-t border-line md:hidden">
                {a.productRows.slice(0, 12).map((r) => (
                  <li key={r.key} className="flex items-center gap-3 border-b border-dashed border-ink/10 px-4 py-2.5 last:border-0">
                    <span className="num w-9 shrink-0 font-semibold">#{r.number}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px]">{r.name}</p>
                      <SplitBar className="mt-1.5" parts={DESTINATIONS.map((d) => ({ label: DESTINATION_LABEL[d], value: r.dest[d] }))} />
                    </div>
                    <div className="num shrink-0 text-right text-[12.5px]">
                      <p className="font-medium">{plural(r.clicks, "click")}</p>
                      <p>{r.commissionCents > 0 ? <Earned cents={r.commissionCents} /> : r.waiting ? <span className="text-muted">{r.waiting} waiting</span> : <span className="text-faint">—</span>}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[680px] text-left text-[13.5px]">
                  <thead>
                    <tr className="border-y border-line">
                      <th className="label px-4 py-2 font-medium">Product</th>
                      <th className="label px-3 py-2 text-right font-medium">Clicks</th>
                      <th className="label w-44 px-3 py-2 font-medium">TikTok · Amazon · Brand</th>
                      <th className="label px-3 py-2 text-right font-medium">Sales</th>
                      <th className="label px-3 py-2 text-right font-medium">Commission</th>
                      <th className="label px-4 py-2 text-right font-medium">Waiting</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.productRows.slice(0, 12).map((r) => (
                      <tr key={r.key} className="border-b border-dashed border-ink/10 last:border-0">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2.5">
                            <ProductImage src={r.imageUrl} alt="" number={r.number} className="size-9 shrink-0 rounded-md" />
                            <span className="num w-9 shrink-0 font-semibold">#{r.number}</span>
                            <span className="min-w-0 truncate">
                              {r.name}
                              {!r.productId && <span className="text-muted"> (deleted)</span>}
                              {r.soldOut && <span className="text-muted"> · sold out</span>}
                              {a.multi && <span className="num text-muted"> · @{r.handle}</span>}
                            </span>
                          </div>
                        </td>
                        <td className="num px-3 py-2 text-right font-medium">{formatCount(r.clicks)}</td>
                        <td className="px-3 py-2">
                          <SplitBar parts={DESTINATIONS.map((d) => ({ label: DESTINATION_LABEL[d], value: r.dest[d] }))} />
                          <p className="num mt-1 text-[11px] text-muted">
                            {r.dest.TIKTOK} · {r.dest.AMAZON} · {r.dest.BRAND}
                          </p>
                        </td>
                        <td className="num px-3 py-2 text-right">{r.sales}</td>
                        <td className="px-3 py-2 text-right">{r.commissionCents > 0 ? <Earned cents={r.commissionCents} /> : <span className="num text-faint">—</span>}</td>
                        <td className="num px-4 py-2 text-right">{r.waiting || <span className="text-faint">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </section>

          <section className="mt-3 grid gap-3 lg:grid-cols-2 [&>*]:min-w-0">
            <div className="sheet p-4">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <div className="min-w-0">
                  <h2 className="font-semibold">Searches that found nothing</h2>
                  <p className="mt-0.5 text-[12.5px] text-muted">What viewers wanted that isn&apos;t on your page. Link these next.</p>
                </div>
                <span className="num text-[12px] text-muted">
                  {formatPercent(t.zeroSearches, t.searches)} of {formatCount(t.searches)}
                </span>
              </div>
              {a.misses.length === 0 ? (
                <p className="mt-4 text-sm text-muted">Every search found something. Nice.</p>
              ) : (
                <ul className="mt-3 divide-y divide-dashed divide-ink/15">
                  {a.misses.slice(0, 8).map((m) => (
                    <li key={`${m.handle}:${m.query}`} className="flex items-center gap-3 py-2 text-[13.5px]">
                      <SearchX className="size-3.5 shrink-0 text-muted" aria-hidden />
                      <span className="num min-w-0 flex-1 truncate">“{m.query}”</span>
                      <span className="num text-muted">×{m.count}</span>
                      <span className="w-16 text-right text-[12px] text-faint">{timeAgo(m.last)}</span>
                      {!a.multi && !m.query.startsWith("#") && !/^\d+$/.test(m.query) ? (
                        <Link
                          href={`/dashboard/products/new?name=${encodeURIComponent(m.query)}`}
                          className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12px] font-medium hover:bg-ink/5"
                        >
                          <Plus className="size-3" aria-hidden /> Add
                        </Link>
                      ) : (
                        <span className="w-[52px]" />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="sheet p-4">
              <h2 className="font-semibold">Recent activity</h2>
              <ul className="mt-3 space-y-2.5">
                {a.activity.map((item, i) => (
                  <ActivityRow key={i} item={item} showHandle={a.multi} />
                ))}
              </ul>
            </div>
          </section>
        </>
      )}
    </>
  );
}

function Segmented({ items, mono }: { items: { label: string; href: string; active: boolean }[]; mono?: boolean }) {
  return (
    <div className="flex rounded-lg border border-line bg-sheet p-0.5">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={cn(
            "flex h-7 items-center rounded-md px-2.5 text-[12.5px]",
            mono && "num",
            it.active ? "bg-ink text-paper" : "text-muted hover:text-ink",
          )}
          aria-current={it.active ? "page" : undefined}
        >
          {it.label}
        </Link>
      ))}
    </div>
  );
}

function ActivityRow({ item, showHandle }: { item: ActivityItem; showHandle: boolean }) {
  const handle = showHandle ? <span className="num text-faint"> @{item.handle}</span> : null;
  const when = <span className="ml-auto shrink-0 pl-2 text-[12px] text-faint">{timeAgo(item.at)}</span>;
  const row = "flex items-center gap-2.5 text-[13.5px]";
  const icon = "size-3.5 shrink-0 text-muted";
  switch (item.kind) {
    case "sale":
      return (
        <li className={row}>
          <Receipt className={icon} aria-hidden />
          <Link href={`/receipt/${item.id}`} className="num min-w-0 truncate hover:underline">
            Caught: <Earned cents={item.commissionCents} /> from #{item.number}
          </Link>
          <span className="truncate text-[12px] text-muted">via {DESTINATION_LABEL[item.destination as Destination]}</span>
          {handle}
          {when}
        </li>
      );
    case "click":
      return (
        <li className={row}>
          <MousePointerClick className={icon} aria-hidden />
          <span className="min-w-0 truncate">
            <span className="num">#{item.number}</span> → {DESTINATION_LABEL[item.destination as Destination]}
          </span>
          {handle}
          {when}
        </li>
      );
    case "signup":
      return (
        <li className={row}>
          <Bell className={icon} aria-hidden />
          <span className="min-w-0 truncate">
            New {item.contactType} sign-up for <span className="num">#{item.number}</span>
            <span className="text-muted"> ({item.reason})</span>
          </span>
          {handle}
          {when}
        </li>
      );
    case "search":
      return (
        <li className={row}>
          <SearchX className={icon} aria-hidden />
          <span className="min-w-0 truncate">
            Searched <span className="num">“{item.query}”</span> <span className="text-muted">— nothing found</span>
          </span>
          {handle}
          {when}
        </li>
      );
  }
}
