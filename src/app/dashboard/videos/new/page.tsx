import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { VideoForm } from "@/components/dashboard/video-form";
import { requireCreator } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Add video" };

export default async function NewVideoPage() {
  const { creator } = await requireCreator();
  const products = await db.product.findMany({
    where: { creatorId: creator.id },
    orderBy: { number: "desc" },
    select: { id: true, number: true, name: true, status: true, isVisible: true },
  });
  return (
    <>
      <PageHeader title="Add video" />
      <VideoForm products={products} initial={{ tiktokUrl: "", caption: "", thumbnailUrl: null, productId: "" }} />
    </>
  );
}
