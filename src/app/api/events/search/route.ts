import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { searchEventSchema } from "@/lib/validation";

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
  const parsed = searchEventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    await db.searchEvent.create({ data: parsed.data });
  } catch {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
