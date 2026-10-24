import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contactSchema } from "@/lib/validation";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";
import { enqueueNotification } from "@/lib/notification-jobs";

const CAPTCHA_AFTER_SUBMISSIONS = 3;

export async function POST(req: NextRequest) {
  const [limit, globalLimit] = await Promise.all([
    rateLimit(`contact:${clientIp(req)}`, 5, 10 * 60_000),
    rateLimit("contact:global", 100, 10 * 60_000),
  ]);
  if (limit.limited || globalLimit.limited)
    return tooManyRequests(Math.max(limit.retryAfter, globalLimit.retryAfter), "Попробуйте позже");
  const body = await req.json().catch(() => null);
  const p = contactSchema.safeParse(body);
  if (!p.success)
    return NextResponse.json({ error: p.error.issues[0]?.message || "Проверьте поля" }, { status: 400 });

  const captchaRequired = limit.count > CAPTCHA_AFTER_SUBMISSIONS;
  if (captchaRequired && !await verifyCaptcha(body.captchaToken, clientIp(req)))
    return NextResponse.json({ error: "Подтвердите проверку безопасности", captchaRequired: true }, { status: 400 });

  await db.$transaction(async tx => {
  const message = await tx.contactMessage.create({
    data: {
      ...p.data,
      contact: p.data.phone || p.data.email,
      modelUrl: p.data.modelUrl || null,
      reference: p.data.reference || null,
    },
  });
  await enqueueNotification(tx, "CONTACT_CREATED", message.id);
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
