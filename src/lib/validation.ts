import { z } from "zod";
import { PRODUCT_STATUSES, RESERVED_HANDLES, SOCIAL_PLATFORMS } from "./constants";

const trimmed = (max: number) => z.string().trim().max(max);

/** Only http(s) links. Zod's .url() alone accepts javascript: and data: URLs. */
const isHttpUrl = (v: string) => {
  try {
    const u = new URL(v);
    return (u.protocol === "https:" || u.protocol === "http:") && u.hostname.includes(".");
  } catch {
    return false;
  }
};

const requiredUrl = z
  .string()
  .trim()
  .min(1, "Required")
  .max(2000)
  .refine(isHttpUrl, "Enter a full URL starting with https://");

const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .transform((v) => (v === "" ? null : v))
  .pipe(requiredUrl.nullable());

/** Images: an http(s) URL, or one of our own files (/media uploads, /demo seed art). */
export const imagePath = z
  .string()
  .max(2000)
  .refine(
    (v) => isHttpUrl(v) || /^\/media\/[0-9a-f-]{36}\.(jpg|png|webp|gif)$/.test(v) || /^\/demo\/[a-z0-9-]+\.svg$/.test(v),
    "Image URL must start with https://",
  );

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((v) => v.replace(/^@/, ""))
  .pipe(
    z
      .string()
      .min(3, "At least 3 characters")
      .max(24, "At most 24 characters")
      .regex(/^[a-z0-9_.]+$/, "Letters, numbers, dots and underscores only")
      .refine((h) => !RESERVED_HANDLES.has(h), "That handle is reserved"),
  );

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters").max(200),
  handle: handleSchema,
  displayName: trimmed(60).min(1, "Required"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});

export const newCreatorSchema = z.object({
  handle: handleSchema,
  displayName: trimmed(60).min(1, "Required"),
});

export const profileSchema = z.object({
  displayName: trimmed(60).min(1, "Required"),
  handle: handleSchema,
  bio: trimmed(280),
  avatarUrl: imagePath.nullable(),
  socials: z
    .array(z.object({ platform: z.enum(SOCIAL_PLATFORMS), url: requiredUrl }))
    .max(8, "Up to 8 links"),
});

/** Price as typed by a creator ("24", "24.5", "$24.99") → cents. */
const priceToCents = z
  .string()
  .trim()
  .transform((v) => v.replace(/[$,\s]/g, ""))
  .pipe(z.string().regex(/^\d{1,6}(\.\d{1,2})?$/, "Enter a price like 24.99"))
  .transform((v) => Math.round(Number(v) * 100));

const percentToBps = z
  .string()
  .trim()
  .transform((v) => v.replace(/[%\s]/g, "") || "0")
  .pipe(z.string().regex(/^\d{1,2}(\.\d{1,2})?$/, "Enter a percentage like 15"))
  .transform((v) => Math.round(Number(v) * 100));

export const productSchema = z
  .object({
    name: trimmed(120).min(1, "Required"),
    description: trimmed(1000),
    price: priceToCents,
    commission: percentToBps,
    imageUrl: imagePath.nullable(),
    tiktokUrl: requiredUrl,
    amazonUrl: optionalUrl,
    brandUrl: optionalUrl,
    status: z.enum(PRODUCT_STATUSES),
    backupProductId: z
      .string()
      .trim()
      .transform((v) => (v === "" ? null : v))
      .nullable(),
    isVisible: z.boolean(),
  })
  .transform((p) => ({ ...p, backupProductId: p.status === "SOLD_OUT" ? p.backupProductId : null }));

export const videoSchema = z.object({
  tiktokUrl: requiredUrl.refine((u) => /(^|\.)tiktok\.com$/i.test(new URL(u).hostname), "Must be a tiktok.com link"),
  caption: trimmed(300).min(1, "Required"),
  thumbnailUrl: imagePath.nullable(),
  productId: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable(),
});

export const notifySchema = z.object({
  productId: z.string().min(1),
  contact: z
    .string()
    .trim()
    .min(1, "Enter a phone number or email")
    .max(200)
    .transform((v, ctx) => {
      if (v.includes("@")) {
        const ok = z.string().email().safeParse(v.toLowerCase()).success;
        if (!ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "That email doesn't look right" });
        return { contact: v.toLowerCase(), contactType: "email" as const };
      }
      const digits = v.replace(/[^\d+]/g, "");
      if (!/^\+?\d{7,15}$/.test(digits)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a phone number or email" });
      }
      return { contact: digits, contactType: "phone" as const };
    }),
});

export const searchEventSchema = z.object({
  creatorId: z.string().min(1),
  query: z.string().trim().min(1).max(100),
  resultCount: z.number().int().min(0).max(10000),
});

export const visitEventSchema = z.object({
  creatorId: z.string().min(1),
  referrer: z.string().max(500).optional(),
});

/** Turns a ZodError into { field: firstMessage } for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
