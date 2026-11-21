import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProductForm } from "@/components/dashboard/product-form";
import { requireCreator } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ name?: string }> }) {
  const { creator } = await requireCreator();
  const { name } = await searchParams;
  const [row, options] = await Promise.all([
    db.creator.findUnique({ where: { id: creator.id }, select: { nextProductNumber: true } }),
    db.product.findMany({
      where: { creatorId: creator.id },
      orderBy: { number: "desc" },
      select: { id: true, number: true, name: true, status: true, isVisible: true },
    }),
  ]);

  return (
    <>
      <PageHeader title="Add product" description="It gets the next number automatically." />
      <ProductForm
        nextNumber={row?.nextProductNumber ?? 1}
        backupOptions={options.map((o) => ({ id: o.id, number: o.number, name: o.name, soldOut: o.status === "SOLD_OUT", hidden: !o.isVisible }))}
        initial={{
          name: name?.slice(0, 120) ?? "",
          description: "",
          price: "",
          commission: "15",
          imageUrl: null,
          tiktokUrl: "",
          amazonUrl: "",
          brandUrl: "",
          status: "AVAILABLE",
          backupProductId: "",
          isVisible: true,
        }}
      />
    </>
  );
}
