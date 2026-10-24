import type { Order, OrderItem } from "@prisma/client";
import { money } from "./money";
import { statusLabel } from "./status";

export const paymentStatusLabel: Record<string, string> = {
  PENDING: "NOT PAID", PAID: "PAID", CANCELED: "NOT PAID · платёж отменён",
};
export function orderCreatedAt(value: Date) {
  return new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", dateStyle: "short", timeStyle: "medium" }).format(value) + " МСК";
}

export function orderTelegramText(order: Order & { items: OrderItem[] }, event: "created" | "paid" | "list" = "list") {
  const heading = event === "paid" ? "Оплата получена" : event === "created" ? "Новый заказ" : "Заказ";
  return [
    `🛒 ${heading} #${order.number}`,
    `Оплата: ${paymentStatusLabel[order.paymentStatus]}`,
    `Статус заказа: ${statusLabel[order.status] || order.status}`,
    `🕒 Создан: ${orderCreatedAt(order.createdAt)}`,
    `👤 ${order.firstName} ${order.lastName}`,
    `📞 ${order.phone}`,
    `📍 ${order.deliveryMethod === "pickup" ? "Самовывоз" : `${order.deliveryProvider || "Доставка"}: ${order.city}, ${order.address}${order.deliveryPointCode ? ` · ${order.deliveryPointCode}` : ""}`}`,
    ...order.items.map(item => `• ${item.productName}${item.variantLabel ? ` (${item.variantLabel})` : ""} × ${item.quantity} — ${money(item.priceInKopecks * item.quantity)}`),
    ...(order.deliveryCostInKopecks > 0 ? [`🚚 Доставка: ${money(order.deliveryCostInKopecks)}`] : []),
    `Итого: ${money(order.totalInKopecks)}`,
    `💬 Комментарий: ${order.comment?.trim() || "не указан"}`,
  ].join("\n");
}

/** Plain text, split on line boundaries without dropping long comments or items. */
export function splitTelegramText(text: string): string[] {
  const result: string[] = [];
  while (text.length > 3500) {
    let end = text.lastIndexOf("\n", 3500);
    end = end > 0 ? end + 1 : 3500;
    // Avoid splitting an emoji's UTF-16 surrogate pair.
    if (/[\uD800-\uDBFF]/.test(text[end - 1])) end--;
    result.push(text.slice(0, end));
    text = text.slice(end);
  }
  if (text) result.push(text);
  return result;
}
