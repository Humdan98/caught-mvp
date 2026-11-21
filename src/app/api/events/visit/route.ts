import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { visitEventSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  // Beacons are tiny; refuse anything big before parsing it.
  const text = await req.text().catch(() => "");
  if (text.length > 2048) return NextResponse.json({ ok: false }, { status: 413 });
  let body: unknown = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }
  const parsed = visitEventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const ua = req.headers.get("user-agent") ?? "";
  const device = /mobile|iphone|android/i.test(ua) ? "mobile" : "desktop";
  let referrer: string | null = null;
  try {
    referrer = parsed.data.referrer ? new URL(parsed.data.referrer).hostname : null;
  } catch {
    referrer = null;
  }

  try {
    await db.pageView.create({ data: { creatorId: parsed.data.creatorId, device, referrer } });
  } catch {
    return NextResponse.json({ ok: false }, { status: 404 }); // unknown creator (FK)
  }
  return NextResponse.json({ ok: true });
}
