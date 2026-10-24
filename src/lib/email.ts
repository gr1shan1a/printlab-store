import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { CustomRequestStatus, OrderStatus } from "@prisma/client";
import { money } from "@/lib/money";
let transport: Transporter | null = null;
function mailer() {
  if (transport) return transport;
  const host = process.env.SMTP_HOST,
    user = process.env.SMTP_USER,
    pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 465);
  transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: true,
    tls: { minVersion: "TLSv1.2" },
    auth: { user, pass },
    pool: true,
    maxConnections: 2,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  return transport;
}
function sender() {
  return {
    name: "form3d-store",
    address: process.env.SMTP_FROM || process.env.SMTP_USER!,
  };
}
async function deliver(
  to: string,
  subject: string,
  title: string,
  text: string,
) {
  const client = mailer();
  if (!client) return false;
  await client.sendMail({
    from: sender(),
    to,
    subject,
    text: `${title}\n\n${text}\n\nform3d-store`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;color:#111"><div style="font-size:13px;font-weight:800;letter-spacing:.12em;color:#62951b">FORM3D-STORE</div><h1 style="font-size:28px;margin:18px 0">${safe(title)}</h1><p style="font-size:17px;line-height:1.6">${safe(text)}</p><p style="margin-top:32px;color:#777">Это автоматическое уведомление о вашей 3D‑печати.</p></div>`,
  });
  return true;
}

export async function sendAccountVerificationEmail(email: string, token: string) {
  const baseUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  if (!baseUrl) throw new Error("APP_URL не настроен для подтверждения email");
  const link = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const client = mailer();
  if (!client) throw new Error("SMTP не настроен для отправки письма");
  await client.sendMail({
    from: sender(), to: email, subject: "Подтвердите email — form3d-store",
    text: `Чтобы подтвердить аккаунт, откройте ссылку (она действует 24 часа):\n${link}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#171914"><h1 style="font-size:25px">Подтвердите email</h1><p style="line-height:1.6">Нажмите кнопку, чтобы завершить регистрацию. Ссылка действует 24 часа.</p><p><a href="${safe(link)}" style="display:inline-block;padding:14px 20px;background:#b7f34a;color:#171914;text-decoration:none;font-weight:700;border-radius:8px">Подтвердить аккаунт</a></p><p style="color:#777;font-size:13px">Если вы не регистрировались, просто проигнорируйте это письмо.</p></div>`,
  });
}
const orderCopy: Record<OrderStatus, { title: string; text: string }> = {
  NEW: {
    title: "Заказ создан",
    text: "Мы получили ваш заказ. После оплаты начнём его обработку.",
  },
  PAID: {
    title: "Оплата подтверждена 🟢",
    text: "Оплата получена. Мы проверим состав заказа и скоро приступим к работе.",
  },
  CONFIRMED: {
    title: "Заказ подтверждён ✅",
    text: "Заказ подтверждён и принят в работу.",
  },
  WAITING_FOR_PRINT: {
    title: "Заказ ожидает печати ⏳",
    text: "Заказ поставлен в производственную очередь.",
  },
  PRINTING: {
    title: "Заказ печатается 🖨",
    text: "Мы начали печать изделий из вашего заказа.",
  },
  READY: {
    title: "Заказ готов 📦",
    text: "Печать завершена, заказ готов к получению или отправке.",
  },
  SHIPPED: {
    title: "Заказ отправлен 🚚",
    text: "Заказ передан в службу доставки.",
  },
  COMPLETED: {
    title: "Заказ завершён 🏁",
    text: "Заказ успешно завершён. Спасибо за обращение!",
  },
  CANCELLED: {
    title: "Заказ отменён",
    text: "Заказ отменён. Если это произошло неожиданно, свяжитесь с нами.",
  },
};
const requestCopy: Record<
  CustomRequestStatus,
  { title: string; text: string }
> = {
  NEW: {
    title: "Заявка получена 🟢",
    text: "Мы получили заявку на индивидуальную 3D‑печать.",
  },
  REVIEWING: {
    title: "Заявка рассматривается 👀",
    text: "Мы проверяем описание и модель, чтобы подтвердить возможность и срок печати.",
  },
  DEFERRED: {
    title: "Нужно дополнительное время ⏰",
    text: "Заявка сохранена и требует дополнительной проверки. Мы вернёмся к ней позже.",
  },
  ACCEPTED: {
    title: "Заявка принята ✅",
    text: "Заявка подтверждена и принята в работу.",
  },
  IN_PRODUCTION: {
    title: "Началась печать 🖨",
    text: "Мы начали изготовление изделия по вашей заявке.",
  },
  READY: {
    title: "Изделие готово 📦",
    text: "Печать завершена. Мы свяжемся для передачи или отправки.",
  },
  COMPLETED: {
    title: "Заявка завершена 🏁",
    text: "Работа по заявке завершена. Спасибо!",
  },
  DECLINED: {
    title: "Заявка отклонена",
    text: "К сожалению, мы не можем выполнить эту заявку в текущем виде.",
  },
};
export async function sendOrderStatus(
  to: string,
  name: string,
  number: number,
  status: OrderStatus,
  orderUrl?: string,
) {
  const copy = orderCopy[status];
  const details = orderUrl ? `\n\nДетали заказа: ${orderUrl}` : "";
  return deliver(
    to,
    `Заказ #${number}: ${copy.title}`,
    `${name}, ${copy.title}`,
    copy.text + details,
  );
}

export async function sendPaidOrderReceipt(order: {
  number: number;
  email: string;
  firstName: string;
  items: { productName: string; variantLabel: string; quantity: number; priceInKopecks: number }[];
  deliveryCostInKopecks: number;
  totalInKopecks: number;
}) {
  const client = mailer();
  if (!client) return false;
  const rows = order.items.map((item) => ({
    label: `${item.productName}${item.variantLabel ? ` · ${item.variantLabel}` : ""} × ${item.quantity}`,
    amount: money(item.priceInKopecks * item.quantity),
  }));
  if (order.deliveryCostInKopecks > 0)
    rows.push({ label: "Доставка СДЭК", amount: money(order.deliveryCostInKopecks) });
  const plainRows = rows.map((row) => `${row.label} — ${row.amount}`).join("\n");
  const htmlRows = rows.map((row) => `<tr><td style="padding:10px 0;border-bottom:1px solid #eee">${safe(row.label)}</td><td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${safe(row.amount)}</td></tr>`).join("");
  await client.sendMail({
    from: sender(),
    to: order.email,
    subject: `Оплата заказа #${order.number} подтверждена`,
    text: `${order.firstName}, спасибо за покупку!\n\nЗаказ #${order.number}\n${plainRows}\n\nИтого: ${money(order.totalInKopecks)}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;color:#111"><div style="font-size:13px;font-weight:800;letter-spacing:.12em;color:#62951b">FORM3D-STORE</div><h1 style="font-size:26px">${safe(order.firstName)}, оплата подтверждена</h1><p>Заказ #${order.number}</p><table style="width:100%;border-collapse:collapse">${htmlRows}<tr><td style="padding-top:16px;font-weight:bold">Итого</td><td style="padding-top:16px;text-align:right;font-weight:bold">${safe(money(order.totalInKopecks))}</td></tr></table></div>`,
  });
  return true;
}
export async function sendCustomStatus(
  to: string,
  name: string,
  status: CustomRequestStatus,
  days?: number | null,
) {
  const copy = requestCopy[status],
    term =
      status === "ACCEPTED" && days
        ? ` Ориентировочный срок изготовления — ${days} дн.`
        : "";
  return deliver(
    to,
    `Заявка на 3D-печать: ${copy.title}`,
    `${name}, ${copy.title}`,
    copy.text + term,
  );
}
function safe(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
