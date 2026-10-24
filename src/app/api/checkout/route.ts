import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validation";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { createYooKassaPayment } from "@/lib/yookassa";
import { enqueueNotification } from "@/lib/notification-jobs";
import { calculateCdekDelivery } from "@/lib/cdek";
import { clientIp } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";
import { guestOrderToken } from "@/lib/guest-order";
export async function POST(req: NextRequest) {
  const user = await currentUser();
  const limit=await rateLimit(`checkout:${clientIp(req)}`,5,10*60_000);
  if(limit.limited)return tooManyRequests(limit.retryAfter);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Не удалось прочитать данные заказа. Проверьте поля и попробуйте ещё раз." }, { status: 400 });
  }
  const p = checkoutSchema.safeParse(body);
  if (!p.success)
    return NextResponse.json(
      { error: p.error.issues[0].message },
      { status: 400 },
    );
  if (!await verifyCaptcha(p.data.captchaToken, clientIp(req)))
    return NextResponse.json({ error: "Подтвердите проверку Cloudflare" }, { status: 400 });
  if (!process.env.YOOKASSA_SHOP_ID || !process.env.YOOKASSA_SECRET_KEY)
    return NextResponse.json(
      { error: "Оплата временно недоступна: магазин ещё не подключён к ЮKassa" },
      { status: 503 },
    );
  const paymentRequestKey = randomUUID();
  try {
    let deliveryCostInKopecks = 0;
    if (p.data.deliveryMethod === "delivery") {
      const variants = await db.productVariant.findMany({
        where: { id: { in: p.data.items.map(item => item.variantId) }, active: true },
        select: { id: true, product: { select: { weightGrams: true } } },
      });
      const weights = new Map(variants.map(variant => [variant.id, variant.product.weightGrams || 100]));
      const weightGrams = p.data.items.reduce((sum, item) => sum + (weights.get(item.variantId) || 100) * item.quantity, 0);
      const estimate=await calculateCdekDelivery({ destinationCityCode: p.data.deliveryCityCode!, deliveryPointCode:p.data.deliveryPointCode, weightGrams });
      deliveryCostInKopecks = estimate.costInKopecks;
    }
    const order = await db.$transaction(
      async (tx) => {
        const rows = [] as {
          variantId: string;
          productName: string;
          variantLabel: string;
          sku: string;
          priceInKopecks: number;
          quantity: number;
        }[];
        for (const requested of p.data.items) {
          const v = await tx.productVariant.findUnique({
            where: { id: requested.variantId },
            include: { product: true },
          });
          if (!v || !v.active || !v.product.active || v.product.archivedAt)
            throw new Error("Товар недоступен");
          const updated = await tx.productVariant.updateMany({
            where: {
              id: v.id,
              reserved: v.reserved,
              stock: { gte: v.reserved + requested.quantity },
            },
            data: { reserved: { increment: requested.quantity } },
          });
          if (updated.count !== 1)
            throw new Error(`Недостаточно товара: ${v.product.name}`);
          rows.push({
            variantId: v.id,
            productName: v.product.name,
            variantLabel: [v.configuration||v.size,v.material,v.color].filter(Boolean).join(" / "),
            sku: v.sku,
            priceInKopecks: v.priceInKopecks,
            quantity: requested.quantity,
          });
        }
        const merchandiseTotal = rows.reduce(
          (s, x) => s + x.priceInKopecks * x.quantity,
          0,
        );
        const total = merchandiseTotal + deliveryCostInKopecks;
        const { items: _, deliveryCityCode: __, customerName, recipientName, consent: ___, captchaToken: ____, ...customer } = p.data;
        const nameParts = recipientName.trim().split(/\s+/);
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || nameParts[0];
        const created = await tx.order.create({
          data: {
            userId: user?.id || null,
            customerName,
            recipientName,
            firstName,
            lastName,
            ...customer,
            deliveryCostInKopecks,
            totalInKopecks: total,
            status: "NEW",
            paymentRequestKey,
            items: {
              create: rows.map((x) => ({
                ...x,
                tasks: { create: { quantity: x.quantity } },
              })),
            },
            history: { create: { status: "NEW" } },
            movements: {
              create: rows.map((x) => ({
                variantId: x.variantId,
                type: "RESERVE",
                quantity: x.quantity,
                comment: "Резерв при оформлении",
              })),
            },
          },
            select: { id: true, number: true, totalInKopecks: true, items: { select: { productName: true, quantity: true, priceInKopecks: true } } },
        });
        await enqueueNotification(tx, "ORDER_CREATED", created.id);
        await enqueueNotification(tx, "ORDER_EMAIL_CREATED", created.id);
        return created;
      },
      { isolationLevel: "Serializable" },
    );
    let payment;
    try {
      payment = await createYooKassaPayment({
        orderId: order.id,
        orderNumber: order.number,
        idempotenceKey: paymentRequestKey,
        amountInKopecks: order.totalInKopecks,
        description: deliveryCostInKopecks ? "товары и доставка из магазина" : "товары из магазина",
        email: p.data.email,
        items: [
          ...order.items.map(item => ({ description: item.productName, quantity: item.quantity, amountInKopecks: item.priceInKopecks })),
          ...(deliveryCostInKopecks > 0 ? [{ description: "Доставка СДЭК", quantity: 1, amountInKopecks: deliveryCostInKopecks, paymentSubject: "service" as const }] : []),
        ],
      });
    } catch (error) {
      // The request may have reached YooKassa even if its response was lost.
      // Keep the reservation and retry later with the same persisted key.
      console.error("Initial YooKassa payment request failed; keeping order for idempotent retry", error);
      return NextResponse.json({
        ...order,
        paymentUrl: `/api/payments/yookassa/${order.id}${user ? "" : `?access=${guestOrderToken(order.id)}`}`,
      }, { status: 201 });
    }
    await db.order.update({ where: { id: order.id }, data: { paymentId: payment.id } });
    return NextResponse.json({ ...order, paymentUrl: payment.confirmation?.confirmation_url }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Prisma.PrismaClientKnownRequestError || e instanceof Prisma.PrismaClientUnknownRequestError || e instanceof Prisma.PrismaClientValidationError ? "Не удалось оформить заказ. Попробуйте ещё раз." : e instanceof Error ? e.message : "Не удалось оформить заказ" },
      { status: 409 },
    );
  }
}
