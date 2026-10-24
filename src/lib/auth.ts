import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { db } from "./db";

const secureCookie = (process.env.NEXT_PUBLIC_STORE_URL || "").startsWith("https://");
const COOKIE = secureCookie ? "__Host-printlab_session" : "printlab_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const SESSION_REFRESH_AFTER_SECONDS = 4 * 60 * 60;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

async function setSessionCookie(token: string) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: secureCookie,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    priority: "high",
  });
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await db.$transaction([
    db.session.deleteMany({ where: { expiresAt: { lte: new Date() } } }),
    db.session.create({ data: { userId, tokenHash: hash(token), expiresAt } }),
  ]);
  await setSessionCookie(token);
}

export async function refreshSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  const session = await db.session.findFirst({
    where: { tokenHash: hash(token), expiresAt: { gt: new Date() }, user: { blockedAt: null, deletedAt: null } },
    select: { id: true, expiresAt: true },
  });
  if (!session) return false;
  const now = Date.now();
  if (session.expiresAt.getTime() - now < SESSION_REFRESH_AFTER_SECONDS * 1000)
    await db.session.update({ where: { id: session.id }, data: { expiresAt: new Date(now + SESSION_TTL_SECONDS * 1000) } });
  // Only the opaque token lives in the browser. Refresh its expiry on activity.
  await setSessionCookie(token);
  return true;
}

export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findFirst({
    where: { tokenHash: hash(token), expiresAt: { gt: new Date() }, user: { blockedAt: null, deletedAt: null } },
    select: { user: { select: { id: true, email: true, name: true, phone: true, telegram: true, role: true } } },
  });
  return session?.user ?? null;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hash(token) } });
  jar.delete(COOKIE);
  jar.delete(secureCookie ? "printlab_session" : "__Host-printlab_session");
}
