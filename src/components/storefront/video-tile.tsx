import { Play } from "lucide-react";
import Link from "next/link";
import type { PublicVideo } from "@/lib/storefront";
import { LinkPending } from "./link-pending";

export function VideoTile({ video, handle }: { video: PublicVideo; handle: string }) {
  const inner = (
    <>
      {video.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={video.thumbnailUrl} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-paper-2 text-faint">
          <Play className="size-6" aria-hidden />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-2 pt-8 pb-2">
        <p className="line-clamp-2 text-[11.5px] leading-snug font-medium text-white">{video.caption}</p>
      </div>
      {video.productNumber !== null && (
        <span className="num absolute top-1.5 left-1.5 rounded bg-paper/95 px-1.5 py-0.5 text-[11px] font-semibold text-ink">
          #{video.productNumber}
        </span>
      )}
    </>
  );
  const cls = "relative block aspect-[9/16] overflow-hidden rounded-lg bg-ink/5";
  if (video.productNumber === null) {
    return (
      <a href={video.tiktokUrl} target="_blank" rel="noopener noreferrer" className={cls} aria-label={`${video.caption} (opens TikTok)`}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={`/${handle}/${video.productNumber}?v=${video.id}`} className={cls} aria-label={`${video.caption} — see product #${video.productNumber}`}>
      {inner}
      <LinkPending />
    </Link>
  );
}
