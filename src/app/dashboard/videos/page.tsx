import { ArrowDown, ArrowUp, Clapperboard, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/dashboard/flash";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireCreator } from "@/lib/auth";
import { db } from "@/lib/db";
import { plural } from "@/lib/format";
import { moveVideo } from "../_actions/videos";

export const metadata: Metadata = { title: "Videos" };

const iconBtn = "grid size-7 place-items-center rounded-md bg-paper/90 text-ink hover:bg-paper disabled:opacity-30";

export default async function VideosPage({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  const { creator } = await requireCreator();
  const sp = await searchParams;
  const [videos, clicks] = await Promise.all([
    db.video.findMany({
      where: { creatorId: creator.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { product: { select: { number: true, name: true, status: true } } },
    }),
    db.clickEvent.groupBy({ by: ["videoId"], where: { creatorId: creator.id, videoId: { not: null } }, _count: true }),
  ]);
  const clicksBy = new Map(clicks.map((c) => [c.videoId, c._count]));

  return (
    <>
      <PageHeader
        title="Videos"
        description="Viewers tap a video on your page to get its product."
        actions={
          <ButtonLink href="/dashboard/videos/new">
            <Plus className="size-4" aria-hidden /> Add video
          </ButtonLink>
        }
      />
      <Flash message={sp.saved ? "Video saved." : sp.deleted ? "Video deleted." : null} />
      {videos.length === 0 ? (
        <EmptyState
          icon={<Clapperboard className="size-7" />}
          title="No videos yet"
          body="Paste a TikTok link, add a thumbnail and caption, and connect it to a product."
          action={<ButtonLink href="/dashboard/videos/new">Add your first video</ButtonLink>}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {videos.map((v, i) => (
            <li key={v.id} className="overflow-hidden rounded-xl border border-line bg-sheet">
              <div className="relative aspect-[9/16] bg-paper-2">
                <Link href={`/dashboard/videos/${v.id}`} className="absolute inset-0">
                  {v.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumbnailUrl} alt="" loading="lazy" className="size-full object-cover" />
                  )}
                </Link>
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                  <form action={moveVideo}>
                    <input type="hidden" name="id" value={v.id} />
                    <input type="hidden" name="dir" value="up" />
                    <button className={iconBtn} disabled={i === 0} aria-label="Move earlier">
                      <ArrowUp className="size-3.5" />
                    </button>
                  </form>
                  <form action={moveVideo}>
                    <input type="hidden" name="id" value={v.id} />
                    <input type="hidden" name="dir" value="down" />
                    <button className={iconBtn} disabled={i === videos.length - 1} aria-label="Move later">
                      <ArrowDown className="size-3.5" />
                    </button>
                  </form>
                </div>
              </div>
              <Link href={`/dashboard/videos/${v.id}`} className="block space-y-1.5 p-3">
                <p className="line-clamp-2 text-[13px] leading-snug">{v.caption}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {v.product ? (
                    <Badge tone={v.product.status === "SOLD_OUT" ? "ink" : "outline"}>
                      #{v.product.number}
                      {v.product.status === "SOLD_OUT" ? " sold out" : ""}
                    </Badge>
                  ) : (
                    <Badge tone="danger">No product</Badge>
                  )}
                  <span className="num text-[11.5px] text-muted">{plural(clicksBy.get(v.id) ?? 0, "click")}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
