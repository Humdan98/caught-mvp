import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";

export const SESSION_COOKIE = "caught_session";
const SESSION_DAYS = 30;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string, activeCreatorId?: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({
    data: { id: hashToken(token), userId, activeCreatorId, expiresAt },
  });
  const jar = await cookies();
  // Secure whenever served over HTTPS; plain http://localhost (dev or `npm start`) still works in every browser.
  const secure = (await headers()).get("x-forwarded-proto") === "https";
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

/** Current session with its user and creator accounts, or null. Cached per request. */
export const getSession = cache(async () => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: hashToken(token) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          creators: { orderBy: { createdAt: "asc" }, select: { id: true, handle: true, displayName: true, avatarUrl: true } },
        },
      },
    },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session;
});

/**
 * Use in dashboard pages and actions. Returns the signed-in user and the creator
 * account they are currently managing. Every write must be scoped by `creator.id`.
 */
export const requireCreator = cache(async () => {
  const session = await getSession();
  if (!session) redirect("/login");
  const { creators } = session.user;
  if (creators.length === 0) redirect("/signup");
  const creator = creators.find((c) => c.id === session.activeCreatorId) ?? creators[0];
  return { session, user: session.user, creator, creators };
});

export async function setActiveCreator(creatorId: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  // Only allow switching to an account this user owns. Checked against the DB, not the
  // cached session, so a just-created account counts.
  const owned = await db.creator.findFirst({ where: { id: creatorId, userId: session.userId }, select: { id: true } });
  if (!owned) return false;
  await db.session.update({ where: { id: session.id }, data: { activeCreatorId: creatorId } });
  return true;
}
