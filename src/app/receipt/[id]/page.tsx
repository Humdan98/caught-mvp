import { Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { buttonClass } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Earned, Price } from "@/components/ui/money";
import { DESTINATION_LABEL, type Destination } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { getReceipt } from "@/lib/receipt";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const r = await getReceipt(id);
  if (!r) return { title: "Receipt" };
  return {
    title: `Caught: $${(r.commissionCents / 100).toFixed(2)} from #${r.productNumber}`,
    openGraph: { images: [`/receipt/${id}/image`] },
    robots: { index: false },
  };
}

export default async function ReceiptPage({ params }: Props) {
  const { id } = await params;
  const r = await getReceipt(id);
  if (!r) notFound();

  return (
    <main className="flex min-h-dvh flex-col items-center px-5 py-10">
      <div className="sheet torn-bottom w-full max-w-sm rounded-b-none px-6 pt-6 pb-10">
        <div className="flex items-center justify-between">
          <Logo className="text-[15px]" />
          <span className="num text-[12px] text-muted">@{r.creator.handle}</span>
        </div>
        <div className="rule my-4" />
        <dl className="num space-y-2 text-[14px]">
          <Row k="Item" v={`#${r.productNumber}`} />
          <p className="text-right font-sans text-[13px] text-ink-2">{r.productName}</p>
          <Row k="Bought on" v={DESTINATION_LABEL[r.destination as Destination]} />
          <Row k="Order" v={<Price cents={r.amountCents} />} />
          <Row k="When" v={formatDateTime(r.createdAt)} />
        </dl>
        <div className="rule my-4" />
        <p className="num flex items-baseline justify-between text-lg font-semibold">
          <span>Caught</span>
          <Earned cents={r.commissionCents} />
        </p>
        <p className="mt-8 text-center text-[11px] tracking-[0.25em] text-faint uppercase">Nothing slips</p>
        <p className="num mt-1 text-center text-[10px] text-faint">{r.id.slice(-10).toUpperCase()}</p>
      </div>

      <div className="mt-6 flex w-full max-w-sm gap-2">
        <a href={`/receipt/${r.id}/image`} download={`caught-${r.productNumber}.png`} className={buttonClass("primary", "md", "flex-1")}>
          <Download className="size-4" aria-hidden /> Save image
        </a>
        <CopyButton value={`/receipt/${r.id}`} label="Copy link" size="md" />
      </div>
      <Link href="/dashboard/sales" className="mt-4 text-[13px] text-muted hover:text-ink">
        ← All sales
      </Link>
    </main>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
