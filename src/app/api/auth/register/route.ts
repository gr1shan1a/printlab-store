import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validation";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";
import { sendAccountVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const [limit, globalLimit] = await Promise.all([
    rateLimit(`register:${clientIp(req)}`, 5, 10 * 60_000),
    rateLimit("register:global", 50, 10 * 60_000),
  ]);
  if (limit.limited || globalLimit.limited) return tooManyRequests(Math.max(limit.retryAfter, globalLimit.retryAfter));
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  if (!await verifyCaptcha(body?.captchaToken, clientIp(req))) return NextResponse.json({ error: "Подтвердите проверку Cloudflare" }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  let user = await db.user.findUnique({ where: { email } });
  if (user?.emailVerifiedAt) return NextResponse.json({ error: "Не удалось создать аккаунт с указанными данными" }, { status: 409 });
  if (!user) {
    user = await db.user.create({ data: { email, name: parsed.data.name, passwordHash: await hashPassword(parsed.data.password) } });
  }
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await db.emailVerificationToken.deleteMany({ where: { userId: user.id } });
  await db.emailVerificationToken.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 24 * 60 * 60_000) } });
  try {
    await sendAccountVerificationEmail(email, token);
  } catch (error) {
    console.error("Unable to send account verification email", error);
    return NextResponse.json({ error: "Не удалось отправить письмо. Попробуйте позже." }, { status: 503 });
  }
  return NextResponse.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
