import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { imagePath } from "./validation";

export const UPLOAD_DIR = join(process.cwd(), "uploads");
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export class UploadError extends Error {}

function sniffImage(b: Buffer): string | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (b.length >= 6 && /^GIF8[79]a$/.test(b.subarray(0, 6).toString("latin1"))) return "gif";
  if (b.length >= 12 && b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP") return "webp";
  return null;
}

/**
 * Saves an uploaded image to ./uploads and returns its public path (/media/...).
 * Returns null when no file was chosen.
 */
export async function saveImageUpload(file: FormDataEntryValue | null): Promise<string | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  const ext = TYPES[file.type];
  if (!ext) throw new UploadError("Use a JPG, PNG, WebP or GIF image");
  if (file.size > MAX_BYTES) throw new UploadError("Image must be under 5 MB");
  const bytes = Buffer.from(await file.arrayBuffer());
  // Don't trust the browser's content type: check the file really is that kind of image.
  if (sniffImage(bytes) !== ext) throw new UploadError("That file isn't a valid JPG, PNG, WebP or GIF image");
  const name = `${randomUUID()}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(join(UPLOAD_DIR, name), bytes);
  return `/media/${name}`;
}

/**
 * Resolves the image for a form that offers both "upload" and "paste a URL".
 * Upload wins; otherwise the URL field (validated); otherwise the existing value.
 */
export async function resolveImageField(
  form: FormData,
  fileField: string,
  urlField: string,
): Promise<string | null> {
  const uploaded = await saveImageUpload(form.get(fileField));
  if (uploaded) return uploaded;
  const url = String(form.get(urlField) ?? "").trim();
  if (!url) return null;
  // A pasted http(s) URL, or the existing /media or /demo image being kept.
  if (!imagePath.safeParse(url).success) throw new UploadError("Image URL must start with https://");
  return url;
}
