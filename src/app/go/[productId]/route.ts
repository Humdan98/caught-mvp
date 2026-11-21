import { NextResponse, type NextRequest } from "next/server";
import { CLICK_SOURCES, SANDBOX_MODE, type ClickSource, type Destination } from "@/lib/constants";
import { db } from "@/lib/db";

const DEST_PARAM: Record<string, Destination> = { tiktok: "TIKTOK", amazon: "AMAZON", brand: "BRAND" };

/**
 * Click tracking redirect: /go/:productId?to=tiktok|amazon|brand&src=...&v=videoId
 * Records the click, then sends the viewer on. Never blocks the viewer on a tracking failure.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const sp = req.nextUrl.searchParams;
  const destination = DEST_PARAM[sp.get("to") ?? "tiktok"] ?? "TIKTOK";
  const source: ClickSource = CLICK_SOURCES.includes(sp.get("src") as ClickSource)
    ? (sp.get("src") as ClickSource)
    : "direct";

  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      creatorId: true,
      number: true,
      name: true,
      isVisible: true,
      tiktokUrl: true,
      amazonUrl: true,
      brandUrl: true,
      creator: { select: { handle: true } },
    },
  });
  if (!product || !product.isVisible) {
    return NextResponse.redirect(new URL(product ? `/${product.creator.handle}` : "/", req.url));
  }

  const target =
    destination === "AMAZON" ? product.amazonUrl : destination === "BRAND" ? product.brandUrl : product.tiktokUrl;
  if (!target) {
    // Button shouldn't exist without a URL; fall back to TikTok Shop rather than a dead end.
    return NextResponse.redirect(product.tiktokUrl);
  }

  // Only attribute a video that actually belongs to this creator.
  const videoParam = sp.get("v");
  const video = videoParam
    ? await db.video.findFirst({ where: { id: videoParam, creatorId: product.creatorId }, select: { id: true } })
    : null;

  let clickId: string | null = null;
  try {
    const click = await db.clickEvent.create({
      data: {
        creatorId: product.creatorId,
        productId: product.id,
        videoId: video?.id,
        productNumber: product.number,
        productName: product.name,
        destination,
        // A backup bought from a video keeps "backup" as its source but still credits the video.
        source: video && source === "direct" ? "video" : source,
      },
      select: { id: true },
    });
    clickId = click.id;
  } catch (err) {
    console.error("click tracking failed", err);
  }

  if (SANDBOX_MODE && clickId) {
    return NextResponse.redirect(new URL(`/sandbox/checkout?click=${clickId}`, req.url), 303);
  }
  return NextResponse.redirect(target, 303);
}
