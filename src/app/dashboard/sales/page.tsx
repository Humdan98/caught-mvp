import { Receipt } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Earned, Price } from "@/components/ui/money";
import { requireCreator } from "@/lib/auth";
import { DESTINATION_LABEL, type Destination } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Sales" };

export default async function SalesPage() {
  const { creator } = await requireCreator();
  const [sales, totals] = await Promise.all([
    db.sale.findMany({ where: { creatorId: creator.id }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.sale.aggregate({ where: { creatorId: creator.id }, _sum: { commissionCents: true, amountCents: true }, _count: true }),
  ]);

  return (
    <>
      <PageHeader
        title="Caught sales"
        description="Sales reported back from TikTok Shop, Amazon and brand sites after a viewer used your page. Sandbox: these come from the simulated checkout."
      />
      {sales.length === 0 ? (
        <EmptyState
          icon={<Receipt className="size-7" />}
          title="No sales yet"
          body={
            <>
              Open your page, tap a buy button and place a simulated order.{" "}
              <a href={`/${creator.handle}`} target="_blank" rel="noopener" className="underline underline-offset-4">
                Open @{creator.handle}
              </a>
            </>
          }
        />
      ) : (
        <>
          <div className="sheet num mb-6 flex flex-wrap gap-x-10 gap-y-3 p-5">
            <div>
              <p className="label font-sans">Sales</p>
              <p className="text-2xl font-semibold">{totals._count}</p>
            </div>
            <div>
              <p className="label font-sans">Order value (GMV)</p>
              <p className="text-2xl font-semibold">
                <Price cents={totals._sum.amountCents ?? 0} />
              </p>
            </div>
            <div>
              <p className="label font-sans">Commission caught</p>
              <p className="text-2xl font-semibold">
                <Earned cents={totals._sum.commissionCents ?? 0} />
              </p>
            </div>
          </div>
          <ul className="overflow-hidden rounded-xl border border-line bg-sheet">
            {sales.map((s) => (
              <li key={s.id} className="flex items-center gap-3 border-b border-dashed border-ink/15 px-4 py-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="num text-[14px]">
                    Caught: <Earned cents={s.commissionCents} /> from #{s.productNumber}
                  </p>
                  <p className="truncate text-[12.5px] text-muted">
                    {s.productName} · <Price cents={s.amountCents} /> on {DESTINATION_LABEL[s.destination as Destination]} ·{" "}
                    {formatDateTime(s.createdAt)}
                  </p>
                </div>
                <Link href={`/receipt/${s.id}`} className="shrink-0 text-[13px] font-medium underline-offset-4 hover:underline">
                  Receipt
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
