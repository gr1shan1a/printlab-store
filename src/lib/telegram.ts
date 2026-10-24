import { CustomRequestStatus, OrderStatus, type Order, type OrderItem } from "@prisma/client";
import { orderTelegramText, splitTelegramText } from "@/lib/order-display";
import { db } from "@/lib/db";
import { money } from "@/lib/money";
import { statusLabel } from "@/lib/status";
import { customStatusLabel } from "@/lib/custom-request";
const api = () =>
  `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
export function telegramEnabled() {
  return Boolean(
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_CHAT_ID,
  );
}
export async function telegram(method: string, body: Record<string, unknown>) {
  if (!telegramEnabled()) return null;
  const res = await fetch(`${api()}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  const data = await res.json();
  if (!res.ok || !data.ok)
    throw new Error(`Telegram ${method}: ${data.description || res.status}`);
  return data;
}
export async function sendAdmin(text: string, reply_markup?: unknown) {
  return telegram("sendMessage", {
    chat_id: process.env.TELEGRAM_ADMIN_CHAT_ID,
    text,
    parse_mode: "HTML",
    reply_markup,
  });
}
export const mainMenu = {
  inline_keyboard: [
    [
      { text: "🛒 Заказы", callback_data: "m:orders" },
      { text: "🧩 Заявки", callback_data: "m:requests" },
    ],
    [
      { text: "🖨 Печать", callback_data: "m:production" },
      { text: "🕘 История", callback_data: "m:history" },
    ],
    [
      { text: "⚙️ Настройки", callback_data: "m:settings" },
      { text: "🔄 Обновить", callback_data: "m:home" },
    ],
  ],
};
export function orderKeyboard(id: string, status: OrderStatus) {
  const map: Partial<
    Record<OrderStatus, { text: string; status: OrderStatus }[]>
  > = {
    NEW: [],
    PAID: [{ text: "✅ Подтвердить", status: "CONFIRMED" }],
    CONFIRMED: [
      { text: "⏳ В очередь", status: "WAITING_FOR_PRINT" },
      { text: "🖨 В печать", status: "PRINTING" },
      { text: "❌ Отменить", status: "CANCELLED" },
    ],
    WAITING_FOR_PRINT: [
      { text: "🖨 В печать", status: "PRINTING" },
      { text: "❌ Отменить", status: "CANCELLED" },
    ],
    PRINTING: [
      { text: "📦 Готов", status: "READY" },
      { text: "❌ Отменить", status: "CANCELLED" },
    ],
    READY: [
      { text: "🚚 Отправлен", status: "SHIPPED" },
      { text: "🏁 Выдан", status: "COMPLETED" },
    ],
    SHIPPED: [{ text: "🏁 Завершить", status: "COMPLETED" }],
  };
  return {
    inline_keyboard: [
      ...((map[status] || []).length ? [(map[status] || []).map((x) => ({
        text: x.text,
        callback_data: `o:${id}:${x.status}`,
      }))] : []),
      [{ text: "↩️ В меню", callback_data: "m:home" }],
    ],
  };
}
export function requestKeyboard(id: string, status: CustomRequestStatus) {
  const rows: unknown[][] = [];
  if (status === "NEW")
    rows.push([
      { text: "👀 Взять", callback_data: `r:${id}:REVIEWING` },
      { text: "⏰ Позже", callback_data: `r:${id}:DEFERRED` },
    ]);
  if (status === "DEFERRED")
    rows.push([
      { text: "↩️ Вернуться", callback_data: `r:${id}:REVIEWING` },
      { text: "❌ Отклонить", callback_data: `r:${id}:DECLINED` },
    ]);
  if (status === "REVIEWING")
    rows.push(
      [2, 3, 5, 7].map((days) => ({
        text: `✅ ${days} дн.`,
        callback_data: `r:${id}:ACCEPTED:${days}`,
      })),
      [
        { text: "⏰ Позже", callback_data: `r:${id}:DEFERRED` },
        { text: "❌ Отклонить", callback_data: `r:${id}:DECLINED` },
      ],
    );
  if (status === "ACCEPTED")
    rows.push([
      { text: "🖨 Начать печать", callback_data: `r:${id}:IN_PRODUCTION` },
    ]);
  if (status === "IN_PRODUCTION")
    rows.push([{ text: "📦 Готово", callback_data: `r:${id}:READY` }]);
  if (status === "READY")
    rows.push([{ text: "🏁 Завершить", callback_data: `r:${id}:COMPLETED` }]);
  rows.push([
    { text: "🧩 Все заявки", callback_data: "m:requests" },
    { text: "↩️ Меню", callback_data: "m:home" },
  ]);
  return { inline_keyboard: rows };
}
async function sendOrderTo(chatId: number | string, order: Order & { items: OrderItem[] }, event: "created" | "paid" | "list") {
  const parts = splitTelegramText(orderTelegramText(order, event));
  for (let i = 0; i < parts.length; i++) {
    if (i) await new Promise(resolve => setTimeout(resolve, 1100));
    await telegram("sendMessage", {
      chat_id: chatId,
      text: parts[i],
      ...(i === parts.length - 1 ? { reply_markup: orderKeyboard(order.id, order.status) } : {}),
    });
  }
}
export async function notifyNewOrder(id: string, event: "created" | "paid" = "created") {
  if (!telegramEnabled()) throw new Error("Telegram configuration is missing");
  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) throw new Error("Telegram order is missing");
  await sendOrderTo(process.env.TELEGRAM_ADMIN_CHAT_ID!, order, event);
}
export async function notifyContact(id: string) {
  if (!telegramEnabled()) throw new Error("Telegram configuration is missing");
  const m = await db.contactMessage.findUnique({ where: { id } });
  if (m)
    await sendAdmin(requestText(m), requestKeyboard(m.id, m.workflowStatus));
}
export async function sendOrders(chatId: number | string, history = false) {
  const rows = await db.order.findMany({
    where: history
      ? { status: { in: ["COMPLETED", "CANCELLED"] } }
      : { status: { notIn: ["COMPLETED", "CANCELLED"] } },
    include: { items: true },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  if (!rows.length)
    return telegram("sendMessage", {
      chat_id: chatId,
      text: history ? "🕘 История пока пуста." : "✨ Текущих заказов нет.",
      reply_markup: mainMenu,
    });
  for (const o of rows) await sendOrderTo(chatId, o, "list");
}
export async function sendRequests(chatId: number | string) {
  const rows = await db.contactMessage.findMany({
    where: { workflowStatus: { notIn: ["COMPLETED", "DECLINED"] } },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  if (!rows.length)
    return telegram("sendMessage", {
      chat_id: chatId,
      text: "✨ Активных заявок нет.",
      reply_markup: mainMenu,
    });
  for (const row of rows)
    await telegram("sendMessage", {
      chat_id: chatId,
      text: requestText(row),
      parse_mode: "HTML",
      reply_markup: requestKeyboard(row.id, row.workflowStatus),
    });
}
export async function productionText() {
  const rows = await db.productionTask.findMany({
    where: { status: { in: ["QUEUED", "PRINTING"] } },
    include: { orderItem: { include: { order: true } }, customRequest: true },
    take: 20,
  });
  return rows.length
    ? rows
        .map(
          (t) => t.orderItem
            ? `#${t.orderItem.order.number} · ${escape(t.orderItem.productName)} × ${t.quantity} · ${statusLabel[t.status]}`
            : `Заявка · ${escape(t.customRequest?.name || "Без имени")} · ${escape(t.customRequest?.message || "Кастомная печать")} × ${t.quantity} · ${statusLabel[t.status]}`,
        )
        .join("\n")
    : "✨ Очередь печати пуста.";
}
export function allowedTelegramUser(id: number) {
  return (process.env.TELEGRAM_ADMIN_USER_IDS || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .includes(String(id));
}
export function isOrderStatus(v: string): v is OrderStatus {
  return Object.values(OrderStatus).includes(v as OrderStatus);
}
export function escape(v: string) {
  return v.replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!,
  );
}
function requestText(m: {
  id: string;
  name: string;
  phone: string | null;
  contact: string;
  email: string | null;
  mode: string | null;
  quantity: number | null;
  message: string;
  modelUrl: string | null;
  workflowStatus: CustomRequestStatus;
  promisedDays: number | null;
}) {
  return `🧩 <b>${customStatusLabel[m.workflowStatus]}</b>\n👤 ${escape(m.name)} · ${escape(m.phone || m.contact)}\n✉️ ${escape(m.email || "email не указан")}\n${m.mode === "READY_MODEL" ? "📎 Только печать" : "🛠 Нужна модель"} · ${m.quantity || 1} шт.\n${escape(m.message)}${m.modelUrl ? `\n🔗 ${escape(m.modelUrl)}` : ""}${m.promisedDays ? `\n⏱ Срок: ${m.promisedDays} дн.` : ""}`;
}
