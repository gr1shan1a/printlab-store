import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { getYooKassaPayment } from "@/lib/yookassa";
import { applyYooKassaPayment } from "@/lib/payment-status";

export async function POST(request: NextRequest) {
  const limit = await rateLimit(`payment-webhook:${clientIp(request)}`, 120, 60_000);
  if (limit.limited) return tooManyRequests(limit.retryAfter);
  try {
    const event = (await request.json()) as { object?: { id?: string } };
    const paymentId = event.object?.id;
    if (typeof paymentId !== "string" || !/^[a-zA-Z0-9-]{1,64}$/.test(paymentId))
      return NextResponse.json({ error: "Некорректное событие" }, { status: 400 });
    if (!await db.order.findFirst({ where: { paymentId }, select: { id: true } }))
      return NextResponse.json({ error: "Платёж пока не найден" }, { status: 503 });
    // Do not trust the notification payload alone: query YooKassa for its current state.
    const payment = await getYooKassaPayment(paymentId);
    await applyYooKassaPayment(paymentId, payment);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("YooKassa webhook failed", error);
    return NextResponse.json({ error: "Ошибка обработки платежа" }, { status: 500 });
  }
}
