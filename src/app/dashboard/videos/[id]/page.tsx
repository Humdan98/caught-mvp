import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { VideoForm } from "@/components/dashboard/video-form";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { requireCreator } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteVideo } from "../../_actions/videos";

export const metadata: Metadata = { title: "Edit video" };

export default async function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { creator } = await requireCreator();
  const { id } = await params;
  const video = await db.video.findFirst({ where: { id, creatorId: creator.id } });
  if (!video) notFound();
  const products = await db.product.findMany({
    where: { creatorId: creator.id },
    orderBy: { number: "desc" },
    select: { id: true, number: true, name: true, status: true, isVisible: true },
  });
  return (
    <>
      <PageHeader title="Edit video" />
      <VideoForm
        products={products}
        initial={{
          id: video.id,
          tiktokUrl: video.tiktokUrl,
          caption: video.caption,
          thumbnailUrl: video.thumbnailUrl,
          productId: video.productId ?? "",
        }}
      />
      <section className="mt-10 flex max-w-2xl flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/25 p-5">
        <div>
          <p className="font-semibold">Delete video</p>
          <p className="text-sm text-muted">Removes it from your page. The product stays.</p>
        </div>
        <form action={deleteVideo}>
          <input type="hidden" name="id" value={video.id} />
          <ConfirmButton>Delete video</ConfirmButton>
        </form>
      </section>
    </>
  );
}
