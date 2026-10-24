import { randomUUID } from "crypto";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const visitorCookie = "form3d_visitor";
const maxAge = 60 * 60 * 24 * 365;

export async function POST(request: NextRequest) {
  const limit = await rateLimit(`analytics:${clientIp(request)}`, 30, 60_000);
  if (limit.limited) return tooManyRequests(limit.retryAfter);
  const existingVisitorId = request.headers
    .get("cookie")
    ?.match(new RegExp(`(?:^|;\\s*)${visitorCookie}=([^;]+)`))?.[1];
  const validVisitorId = existingVisitorId && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(existingVisitorId);
  const visitorId = validVisitorId ? existingVisitorId! : randomUUID();

  await db.$transaction([
    db.homeVisitor.upsert({
      where: { id: visitorId },
      create: { id: visitorId },
      update: {},
    }),
    db.homeVisit.create({ data: { visitorId } }),
  ]);

  const response = NextResponse.json({ ok: true });
  if (!validVisitorId) {
    response.cookies.set(visitorCookie, visitorId, {
      httpOnly: true,
      maxAge,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return response;
}
