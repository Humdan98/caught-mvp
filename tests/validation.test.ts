import assert from "node:assert/strict";
import { test } from "node:test";
import { handleSchema, imagePath, notifySchema, productSchema, profileSchema, videoSchema } from "../src/lib/validation";

const validProduct = {
  name: "Lip Oil", description: "", price: "14", commission: "20", imageUrl: null,
  tiktokUrl: "https://shop.tiktok.com/x", amazonUrl: "", brandUrl: "", status: "AVAILABLE",
  backupProductId: "", isVisible: true,
};
const validProfile = { displayName: "Maya", handle: "maya", bio: "", avatarUrl: null, socials: [] };

test("handles are normalised and reserved words rejected", () => {
  assert.equal(handleSchema.parse("@MayaFinds"), "mayafinds");
  assert.equal(handleSchema.safeParse("dashboard").success, false);
  assert.equal(handleSchema.safeParse("no spaces").success, false);
});

test("notify accepts email or phone and tells them apart", () => {
  const email = notifySchema.parse({ productId: "x", contact: "Ava@Example.com" });
  assert.deepEqual(email.contact, { contact: "ava@example.com", contactType: "email" });
  const phone = notifySchema.parse({ productId: "x", contact: "(310) 555-0142" });
  assert.deepEqual(phone.contact, { contact: "3105550142", contactType: "phone" });
  assert.equal(notifySchema.safeParse({ productId: "x", contact: "hello" }).success, false);
});

test("product price and commission parse to integers; backup dropped when available", () => {
  const base = {
    name: "Lip Oil", description: "", price: "$14.5", commission: "20%", imageUrl: null,
    tiktokUrl: "https://shop.tiktok.com/x", amazonUrl: "", brandUrl: "", status: "AVAILABLE",
    backupProductId: "abc", isVisible: true,
  };
  const r = productSchema.parse(base);
  assert.equal(r.price, 1450);
  assert.equal(r.commission, 2000);
  assert.equal(r.amazonUrl, null);
  assert.equal(r.backupProductId, null);
  assert.equal(productSchema.parse({ ...base, status: "SOLD_OUT" }).backupProductId, "abc");
  assert.equal(productSchema.safeParse({ ...base, tiktokUrl: "nope" }).success, false);
});

test("links must be http(s): javascript:, data: and ftp: are rejected", () => {
  for (const bad of ["javascript:alert(1)", "data:text/html,hi", "ftp://x.com/a", "https://localhost"]) {
    assert.equal(productSchema.safeParse({ ...validProduct, tiktokUrl: bad }).success, false, bad);
    assert.equal(profileSchema.safeParse({ ...validProfile, socials: [{ platform: "x", url: bad }] }).success, false, bad);
  }
  assert.equal(profileSchema.safeParse({ ...validProfile, socials: [{ platform: "x", url: "https://x.com/me" }] }).success, true);
});

test("video links must really be on tiktok.com", () => {
  const v = { caption: "c", thumbnailUrl: null, productId: "" };
  assert.equal(videoSchema.safeParse({ ...v, tiktokUrl: "https://www.tiktok.com/@a/video/1" }).success, true);
  assert.equal(videoSchema.safeParse({ ...v, tiktokUrl: "https://evil.com/?tiktok.com" }).success, false);
  assert.equal(videoSchema.safeParse({ ...v, tiktokUrl: "javascript:alert('tiktok.com')" }).success, false);
});

test("images: http(s) or our own /media and /demo files only", () => {
  assert.equal(imagePath.safeParse("https://cdn.example.com/a.jpg").success, true);
  assert.equal(imagePath.safeParse("/media/3f2a9c1e-0b7d-4e8a-9c1f-2d3e4f5a6b7c.png").success, true);
  assert.equal(imagePath.safeParse("/demo/p-lip-oil.svg").success, true);
  assert.equal(imagePath.safeParse("/go/abc?to=amazon").success, false);
  assert.equal(imagePath.safeParse("//evil.com/x.png").success, false);
  assert.equal(imagePath.safeParse("javascript:alert(1)").success, false);
});
