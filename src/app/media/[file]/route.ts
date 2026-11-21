import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "@/lib/db";
import { LEGACY_UPLOAD_DIR } from "@/lib/uploads";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

// Uploads never change (a new upload gets a new id), so browsers and Vercel's CDN can keep them.
const HEADERS = {
  "cache-control": "public, max-age=31536000, s-maxage=31536000, immutable",
  "x-content-type-options": "nosniff",
};

/** Serves creator uploads: /media/<uuid>.<ext>. From the database, or ./uploads for files from older builds. */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  // Only our own generated names. Blocks path traversal.
  const m = file.match(/^([0-9a-f-]{36})\.(jpg|png|webp|gif)$/);
  if (!m) return new Response("Not found", { status: 404 });
  const [, id, ext] = m;

  const row = await db.mediaFile.findUnique({ where: { id }, select: { data: true, contentType: true } });
  if (row) {
    return new Response(new Uint8Array(row.data), { headers: { ...HEADERS, "content-type": row.contentType } });
  }
  try {
    const data = await readFile(join(LEGACY_UPLOAD_DIR, file));
    return new Response(new Uint8Array(data), { headers: { ...HEADERS, "content-type": TYPES[ext] } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
