import { Bell, Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { EmptyState } from "@/components/ui/empty-state";
import { requireCreator } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Sign-ups" };

export default async function SignupsPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { creator } = await requireCreator();
  const { product: filter } = await searchParams;

  const [byProduct, signups] = await Promise.all([
    db.product.findMany({
      where: { creatorId: creator.id, signups: { some: {} } },
      select: { id: true, number: true, name: true, status: true, _count: { select: { signups: true } } },
      orderBy: { signups: { _count: "desc" } },
    }),
    db.notificationSignup.findMany({
      where: { creatorId: creator.id, ...(filter && { productId: filter }) },
      include: { product: { select: { number: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);
  const total = byProduct.reduce((s, p) => s + p._count.signups, 0);

  return (
    <>
      <PageHeader
        title="Sign-ups"
        description="Viewers who asked to hear about a sale or restock. Caught doesn't send messages in this build — export and text them yourself."
        actions={
          total > 0 && (
            <a href={`/dashboard/signups/export${filter ? `?product=${filter}` : ""}`} className={buttonClass("secondary", "sm")}>
              <Download className="size-3.5" aria-hidden /> Export CSV
            </a>
          )
        }
      />
      {total === 0 ? (
        <EmptyState
          icon={<Bell className="size-7" />}
          title="No sign-ups yet"
          body="Viewers can tap “Text me when it's on sale” on any product. Sold-out products get the most."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr] [&>*]:min-w-0">
          <div className="space-y-1">
            <p className="label mb-2">Waiting per product</p>
            <Link
              href="/dashboard/signups"
              className={cn("flex items-center justify-between rounded-lg px-3 py-2 text-sm", !filter ? "bg-ink text-paper" : "hover:bg-ink/5")}
            >
              All products <span className="num">{total}</span>
            </Link>
            {byProduct.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/signups?product=${p.id}`}
                className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm", filter === p.id ? "bg-ink text-paper" : "hover:bg-ink/5")}
              >
                <span className="num w-9 shrink-0 font-medium">#{p.number}</span>
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                {p.status === "SOLD_OUT" && <span className="text-[10px] tracking-wide uppercase opacity-60">sold out</span>}
                <span className="num">{p._count.signups}</span>
              </Link>
            ))}
          </div>
          <div className="overflow-x-auto rounded-xl border border-line bg-sheet">
            <table className="w-full min-w-[520px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="label px-4 py-2.5 font-medium">Contact</th>
                  <th className="label px-4 py-2.5 font-medium">Product</th>
                  <th className="label px-4 py-2.5 font-medium">Wants</th>
                  <th className="label px-4 py-2.5 text-right font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {signups.map((s) => (
                  <tr key={s.id} className="border-b border-dashed border-ink/10 last:border-0">
                    <td className="num px-4 py-2.5">{s.contact}</td>
                    <td className="px-4 py-2.5">
                      <span className="num font-medium">#{s.product.number}</span>{" "}
                      <span className="text-muted">{s.product.name.length > 28 ? s.product.name.slice(0, 28) + "…" : s.product.name}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone="outline">{s.reason === "restock" ? "Restock" : "Sale"}</Badge>
                    </td>
                    <td className="num px-4 py-2.5 text-right text-muted">{formatDateTime(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
