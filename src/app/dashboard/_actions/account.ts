"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCreator, setActiveCreator } from "@/lib/auth";
import { db } from "@/lib/db";
import { UploadError, resolveImageField } from "@/lib/uploads";
import { fieldErrors, newCreatorSchema, profileSchema } from "@/lib/validation";
import type { FormState } from "./result";

export async function switchAccount(form: FormData) {
  await setActiveCreator(String(form.get("creatorId") ?? ""));
  revalidatePath("/dashboard", "layout");
  redirect(String(form.get("returnTo") ?? "/dashboard").startsWith("/dashboard") ? String(form.get("returnTo")) : "/dashboard");
}

/** Adds another creator account (e.g. a second niche) under the same login. */
export async function createCreatorAccount(_prev: FormState, form: FormData): Promise<FormState> {
  const { user } = await requireCreator();
  const parsed = newCreatorSchema.safeParse({ handle: form.get("handle"), displayName: form.get("displayName") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  if (user.creators.length >= 10) return { message: "Up to 10 accounts per login." };
  const taken = await db.creator.findUnique({ where: { handle: parsed.data.handle }, select: { id: true } });
  if (taken) return { errors: { handle: `@${parsed.data.handle} is taken` } };

  const creator = await db.creator.create({ data: { ...parsed.data, userId: user.id } });
  await setActiveCreator(creator.id);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/products?welcome=1");
}

export async function updateProfile(_prev: FormState, form: FormData): Promise<FormState> {
  const { creator } = await requireCreator();

  let avatarUrl: string | null;
  try {
    avatarUrl = await resolveImageField(form, "avatarFile", "avatarUrl", creator.id);
  } catch (e) {
    return { errors: { avatarUrl: e instanceof UploadError ? e.message : "Upload failed" } };
  }

  const platforms = form.getAll("socialPlatform").map(String);
  const urls = form.getAll("socialUrl").map(String);
  const socials = platforms
    .map((platform, i) => ({ platform, url: (urls[i] ?? "").trim() }))
    .filter((s) => s.url !== "");

  const parsed = profileSchema.safeParse({
    displayName: form.get("displayName"),
    handle: form.get("handle"),
    bio: form.get("bio") ?? "",
    avatarUrl,
    socials,
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const data = parsed.data;

  if (data.handle !== creator.handle) {
    const taken = await db.creator.findUnique({ where: { handle: data.handle }, select: { id: true } });
    if (taken) return { errors: { handle: `@${data.handle} is taken` } };
  }

  try {
    await db.$transaction([
      db.creator.update({
        where: { id: creator.id },
        data: { displayName: data.displayName, handle: data.handle, bio: data.bio, avatarUrl: data.avatarUrl },
      }),
      db.socialLink.deleteMany({ where: { creatorId: creator.id } }),
      db.socialLink.createMany({
        data: data.socials.map((s, i) => ({ creatorId: creator.id, platform: s.platform, url: s.url, sortOrder: i })),
      }),
    ]);
  } catch (err) {
    console.error("updateProfile failed", err);
    return { message: "Couldn't save. Try again." };
  }
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/${data.handle}`);
  return { ok: true, message: "Saved." };
}
