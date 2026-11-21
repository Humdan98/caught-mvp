"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCreator } from "@/lib/auth";
import { db } from "@/lib/db";
import { UploadError, resolveImageField } from "@/lib/uploads";
import { fieldErrors, videoSchema } from "@/lib/validation";
import type { FormState } from "./result";

function refresh(handle: string) {
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/${handle}`, "layout");
}

export async function saveVideo(_prev: FormState, form: FormData): Promise<FormState> {
  const { creator } = await requireCreator();
  const id = String(form.get("id") ?? "") || null;

  let thumbnailUrl: string | null;
  try {
    thumbnailUrl = await resolveImageField(form, "thumbnailFile", "thumbnailUrl", creator.id);
  } catch (e) {
    return { errors: { thumbnailUrl: e instanceof UploadError ? e.message : "Upload failed" } };
  }

  const parsed = videoSchema.safeParse({
    tiktokUrl: form.get("tiktokUrl"),
    caption: form.get("caption"),
    thumbnailUrl,
    productId: form.get("productId") ?? "",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const data = parsed.data;

  if (data.productId) {
    const owns = await db.product.findFirst({ where: { id: data.productId, creatorId: creator.id }, select: { id: true } });
    if (!owns) return { errors: { productId: "Pick one of your products" } };
  }

  try {
    if (id) {
      const res = await db.video.updateMany({ where: { id, creatorId: creator.id }, data });
      if (res.count === 0) return { message: "Video not found." };
    } else {
      const top = await db.video.findFirst({ where: { creatorId: creator.id }, orderBy: { sortOrder: "asc" }, select: { sortOrder: true } });
      await db.video.create({ data: { ...data, creatorId: creator.id, sortOrder: (top?.sortOrder ?? 1) - 1 } });
    }
  } catch (err) {
    console.error("saveVideo failed", err);
    return { message: "Couldn't save the video. Try again." };
  }
  refresh(creator.handle);
  redirect("/dashboard/videos?saved=1");
}

export async function deleteVideo(form: FormData) {
  const { creator } = await requireCreator();
  await db.video.deleteMany({ where: { id: String(form.get("id") ?? ""), creatorId: creator.id } });
  refresh(creator.handle);
  redirect("/dashboard/videos?deleted=1");
}

export async function moveVideo(form: FormData) {
  const { creator } = await requireCreator();
  const id = String(form.get("id") ?? "");
  const dir = form.get("dir") === "up" ? -1 : 1;
  const rows = await db.video.findMany({
    where: { creatorId: creator.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: { id: true },
  });
  const i = rows.findIndex((r) => r.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= rows.length) return;
  [rows[i], rows[j]] = [rows[j], rows[i]];
  await db.$transaction(rows.map((r, idx) => db.video.update({ where: { id: r.id }, data: { sortOrder: idx } })));
  refresh(creator.handle);
}
