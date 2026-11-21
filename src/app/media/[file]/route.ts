import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { UPLOAD_DIR } from "@/lib/uploads";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/** Serves creator uploads from ./uploads (files added after build aren't served from /public). */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  // Only our own generated names: uuid.ext. Blocks path traversal.
  const m = file.match(/^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/);
  if (!m) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(join(UPLOAD_DIR, file));
    return new Response(data, {
      headers: {
        "content-type": TYPES[m[1]],
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
