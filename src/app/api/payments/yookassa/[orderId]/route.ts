import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { applyYooKassaPayment } from "@/lib/payment-status";
import { createYooKassaPayment, getYooKassaPayment } from "@/lib/yookassa";
import { isValidGuestOrderToken } from "@/lib/guest-order";

export async function GET(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const user = await currentUser();
  const baseUrl = process.env.NEXT_PUBLIC_STORE_URL;
  const { orderId } = await params;
  const access = req.nextUrl.searchParams.get("access");
  const guestAccess = isValidGuestOrderToken(orderId, access);
  const returnPath = `/order/${orderId}${guestAccess ? `?access=${access}` : ""}`;
  if ((!user && !guestAccess) || !baseUrl) return NextResponse.json({ error: "Оплата недоступна" }, { status: 401 });
  let order = await db.order.findFirst({
    where: { id: orderId, ...(user ? (user.role === "ADMIN" ? {} : { userId: user.id }) : { userId: null }) },
    include: { items: { select: { productName: true, quantity: true, priceInKopecks: true } } },
  });
  if (!order || order.paymentStatus !== "PENDING" || order.status === "CANCELLED")
    return NextResponse.redirect(`${baseUrl}${returnPath}`);

  // A retry reuses the existing YooKassa payment. Never replace its ID with a new payment.
  if (order.paymentId) {
    const existing = await getYooKassaPayment(order.paymentId);
    await applyYooKassaPayment(order.paymentId, existing);
    if (existing.status === "pending" || existing.status === "waiting_for_capture") {
      const url = existing.confirmation?.confirmation_url;
      if (url) return NextResponse.redirect(url);
    }
    return NextResponse.redirect(`${baseUrl}${returnPath}`);
  }

  // YooKassa keeps an Idempotence-Key for 24 hours. If we never stored a
  // returned payment ID, retrying after that window could create a duplicate.
  if (Date.now() - order.createdAt.getTime() > 23 * 60 * 60 * 1000)
    return NextResponse.redirect(`${baseUrl}${returnPath}${returnPath.includes("?") ? "&" : "?"}payment=retry-expired`);

  if (!order.paymentRequestKey) {
    const key = randomUUID();
    await db.order.updateMany({ where: { id: order.id, paymentRequestKey: null }, data: { paymentRequestKey: key } });
    order = await db.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { items: { select: { productName: true, quantity: true, priceInKopecks: true } } },
    });
    if (order.paymentStatus !== "PENDING" || order.status === "CANCELLED")
      return NextResponse.redirect(`${baseUrl}${returnPath}`);
  }

  const merchandiseTotal = order.items.reduce((sum, item) => sum + item.priceInKopecks * item.quantity, 0);
  const existingShippingCharge = Math.max(0, order.totalInKopecks - merchandiseTotal);
  const shippingCharge = order.deliveryMethod === "delivery"
    ? Math.max(order.deliveryCostInKopecks, existingShippingCharge)
    : existingShippingCharge;
  const paymentTotal = merchandiseTotal + shippingCharge;
  if (paymentTotal !== order.totalInKopecks)
    await db.order.update({ where: { id: order.id }, data: { totalInKopecks: paymentTotal } });
  const payment = await createYooKassaPayment({
    orderId: order.id,
    orderNumber: order.number,
    idempotenceKey: order.paymentRequestKey!,
    amountInKopecks: paymentTotal,
    description: shippingCharge ? "товары и доставка из магазина" : "товары из магазина",
    email: order.email,
    items: [
      ...order.items.map(item => ({ description: item.productName, quantity: item.quantity, amountInKopecks: item.priceInKopecks })),
      ...(shippingCharge ? [{ description: "Доставка СДЭК", quantity: 1, amountInKopecks: shippingCharge, paymentSubject: "service" as const }] : []),
    ],
  });
  await db.order.updateMany({ where: { id: order.id, paymentId: null }, data: { paymentId: payment.id } });
  if (payment.status !== "pending" && payment.status !== "waiting_for_capture")
    await applyYooKassaPayment(payment.id, payment);
  return NextResponse.redirect(payment.confirmation?.confirmation_url || `${baseUrl}${returnPath}`);
}
