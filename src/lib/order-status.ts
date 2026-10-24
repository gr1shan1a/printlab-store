import { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { sendOrderStatus } from "@/lib/email";
const allowed: Record<OrderStatus, OrderStatus[]> = {
  NEW: ["CONFIRMED", "CANCELLED"],
  PAID: ["CONFIRMED"],
  CONFIRMED: ["WAITING_FOR_PRINT", "PRINTING", "CANCELLED"],
  WAITING_FOR_PRINT: ["PRINTING", "CANCELLED"],
  PRINTING: ["READY", "CANCELLED"],
  READY: ["SHIPPED", "COMPLETED"],
  SHIPPED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};
export async function changeOrderStatus(
  id: string,
  status: OrderStatus,
  actorId?: string,
) {
  const order = await db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id },
      include: { items: true },
    });
    if (status === "PAID")
      throw new Error("Статус оплаты устанавливается только после подтверждения ЮKassa");
    if (status !== "CANCELLED" && status !== order.status && order.paymentStatus !== "PAID")
      throw new Error("Заказ можно передать в работу только после подтверждения оплаты ЮKassa");
    if (status === "CANCELLED" && order.paymentStatus === "PENDING" && (order.paymentId || order.paymentRequestKey))
      throw new Error("Нельзя отменить заказ с незавершённым платежом. Сначала дождитесь отмены платежа в ЮKassa.");
    if (!allowed[order.status].includes(status))
      throw new Error(`Переход ${order.status} → ${status} запрещён`);
    const changed = await tx.order.updateMany({
      where: { id, status: order.status },
      data: { status },
    });
    if (changed.count !== 1)
      throw new Error("Заказ уже был изменён. Обновите список.");
    if (status === "CANCELLED")
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { reserved: { decrement: item.quantity } },
        });
        await tx.inventoryMovement.create({
          data: {
            variantId: item.variantId,
            orderId: id,
            type: "RELEASE",
            quantity: item.quantity,
            comment: "Заказ отменён",
            createdBy: actorId,
          },
        });
      }
    if (status === "COMPLETED")
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            reserved: { decrement: item.quantity },
            stock: { decrement: item.quantity },
          },
        });
        await tx.inventoryMovement.create({
          data: {
            variantId: item.variantId,
            orderId: id,
            type: "SALE",
            quantity: item.quantity,
            comment: "Заказ завершён",
            createdBy: actorId,
          },
        });
      }
    await tx.orderStatusHistory.create({ data: { orderId: id, status } });
    await tx.auditLog.create({
      data: {
        actorId,
        action: actorId
          ? "ADMIN_CHANGE_ORDER_STATUS"
          : "TELEGRAM_CHANGE_ORDER_STATUS",
        entityType: "Order",
        entityId: id,
        before: { status: order.status },
        after: { status },
      },
    });
    return { ...order, status };
  });
  let emailSent = false;
  try {
    emailSent = await sendOrderStatus(
      order.email,
      order.firstName,
      order.number,
      status,
    );
  } catch (error) {
    console.error("Order status email failed", error);
  }
  return { ...order, emailSent };
}
