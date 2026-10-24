import { db } from "@/lib/db";
import { sendOrderStatus, sendPaidOrderReceipt } from "@/lib/email";
import { enqueueNotification } from "@/lib/notification-jobs";
import { getYooKassaPayment, type YooKassaPayment } from "@/lib/yookassa";

export async function applyYooKassaPayment(paymentId: string, payment: YooKassaPayment) {
  const order = await db.order.findFirst({
    where: { paymentId },
    include: { items: true },
  });
  if (!order) return null;

  if (payment.id !== paymentId) throw new Error("Payment ID mismatch");
  if (payment.status === "succeeded" && payment.paid) {
    if (payment.amount?.currency !== "RUB" || payment.amount.value !== (order.totalInKopecks / 100).toFixed(2) || payment.metadata?.orderId !== order.id)
      throw new Error("Payment amount, currency or order mismatch");
    const changed = await db.$transaction(async (tx) => {
      const update = await tx.order.updateMany({
        where: { id: order.id, paymentStatus: "PENDING", status: { not: "CANCELLED" } },
        data: { paymentStatus: "PAID", paidAt: new Date(), status: "PAID" },
      });
      if (update.count !== 1) return false;
      await tx.orderStatusHistory.create({ data: { orderId: order.id, status: "PAID" } });
      await tx.auditLog.create({
        data: {
          action: "YOOKASSA_PAYMENT_CONFIRMED",
          entityType: "Order",
          entityId: order.id,
          before: { status: order.status, paymentStatus: order.paymentStatus },
          after: { status: "PAID", paymentStatus: "PAID", paymentId },
        },
      });
      await enqueueNotification(tx, "ORDER_PAID", order.id);
      return true;
    });
    if (changed) {
      const results = await Promise.allSettled([
        sendPaidOrderReceipt(order),
      ]);
      for (const result of results)
        if (result.status === "rejected")
          console.error("Paid order notification failed", result.reason);
    } else if (order.status === "CANCELLED") {
      console.error(`YooKassa confirmed payment ${paymentId} for already-cancelled order ${order.id}`);
    }
  } else if (payment.status === "canceled") {
    const changed = await db.$transaction(async (tx) => {
      const update = await tx.order.updateMany({
        where: { id: order.id, paymentStatus: "PENDING", status: { not: "CANCELLED" } },
        data: { paymentStatus: "CANCELED", status: "CANCELLED" },
      });
      if (update.count !== 1) return false;
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { reserved: { decrement: item.quantity } },
        });
        await tx.inventoryMovement.create({
          data: {
            variantId: item.variantId,
            orderId: order.id,
            type: "RELEASE",
            quantity: item.quantity,
            comment: "Платёж ЮKassa отменён",
          },
        });
      }
      await tx.orderStatusHistory.create({ data: { orderId: order.id, status: "CANCELLED" } });
      await tx.auditLog.create({
        data: {
          action: "YOOKASSA_PAYMENT_CANCELED",
          entityType: "Order",
          entityId: order.id,
          before: { status: order.status, paymentStatus: order.paymentStatus },
          after: { status: "CANCELLED", paymentStatus: "CANCELED", paymentId },
        },
      });
      return true;
    });
    if (changed)
      try {
        await sendOrderStatus(order.email, order.firstName, order.number, "CANCELLED");
      } catch (error) {
        console.error("Canceled order email failed", error);
      }
  }
  return payment;
}

/** Fallback for a user returning from YooKassa when a webhook is delayed or misconfigured. */
export async function syncYooKassaOrder(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { paymentId: true, paymentStatus: true },
  });
  if (!order?.paymentId || order.paymentStatus !== "PENDING") return null;
  const payment = await getYooKassaPayment(order.paymentId);
  await applyYooKassaPayment(order.paymentId, payment);
  return payment;
}
