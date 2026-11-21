import { requireCreator } from "@/lib/auth";
import { db } from "@/lib/db";

const csvCell = (v: string | number) => {
  const s = String(v);
  // Quote, and neutralise spreadsheet formula injection.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  const { creator } = await requireCreator();
  const product = new URL(req.url).searchParams.get("product");
  const rows = await db.notificationSignup.findMany({
    where: { creatorId: creator.id, ...(product && { productId: product }) },
    include: { product: { select: { number: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  const lines = [
    ["product_number", "product_name", "contact", "type", "reason", "signed_up_at"].join(","),
    ...rows.map((r) =>
      [r.product.number, r.product.name, r.contact, r.contactType, r.reason, r.createdAt.toISOString()].map(csvCell).join(","),
    ),
  ];
  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="caught-${creator.handle}-signups.csv"`,
    },
  });
}
