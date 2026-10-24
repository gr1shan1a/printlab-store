import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import {
  allowedTelegramUser,
  isOrderStatus,
  mainMenu,
  orderKeyboard,
  productionText,
  requestKeyboard,
  sendOrders,
  sendRequests,
  telegram,
} from "@/lib/telegram";
import { changeOrderStatus } from "@/lib/order-status";
import {
  changeCustomRequestStatus,
  isCustomStatus,
} from "@/lib/custom-request";
function same(a: string, b: string) {
  const aa = Buffer.from(a),
    bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
async function answer(id: string, text: string, alert = false) {
  await telegram("answerCallbackQuery", {
    callback_query_id: id,
    text,
    show_alert: alert,
  });
}
async function menu(chatId: number) {
  await telegram("sendMessage", {
    chat_id: chatId,
    text: "<b>PrintLab · управление</b>\nВыберите раздел. Очереди не теряются: каждую заявку можно обработать сейчас или отложить.",
    parse_mode: "HTML",
    reply_markup: mainMenu,
  });
}
export async function POST(req: NextRequest) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET || "",
    actual = req.headers.get("x-telegram-bot-api-secret-token") || "";
  if (!expected || !same(expected, actual))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const u = await req.json(),
    from = u.message?.from || u.callback_query?.from;
  if (!from || !allowedTelegramUser(from.id))
    return NextResponse.json({ ok: true });
  const chatId = Number(
    u.message?.chat?.id || u.callback_query?.message?.chat?.id,
  );
  if (u.callback_query) {
    const q = u.callback_query,
      data = String(q.data || "");
    try {
      const [kind, id, action, arg] = data.split(":");
      if (kind === "m") {
        await answer(q.id, "Обновляю");
        if (id === "orders") await sendOrders(chatId);
        else if (id === "requests") await sendRequests(chatId);
        else if (id === "production")
          await telegram("sendMessage", {
            chat_id: chatId,
            text: `🖨 <b>Очередь печати</b>\n${await productionText()}`,
            parse_mode: "HTML",
            reply_markup: mainMenu,
          });
        else if (id === "history") await sendOrders(chatId, true);
        else if (id === "settings")
          await telegram("sendMessage", {
            chat_id: chatId,
            text: `⚙️ <b>Настройки</b>\nEmail: ${process.env.SMTP_HOST ? "✅ SMTP подключён" : "⚠️ SMTP не настроен"}\nWebhook: ✅ защищён\nМагазин: ${process.env.NEXT_PUBLIC_STORE_URL}`,
            parse_mode: "HTML",
            reply_markup: mainMenu,
          });
        else await menu(chatId);
        return NextResponse.json({ ok: true });
      }
      if (kind === "o" && id && isOrderStatus(action)) {
        const order = await changeOrderStatus(id, action);
        await answer(q.id, `Заказ: ${action}`);
        await telegram("editMessageReplyMarkup", {
          chat_id: chatId,
          message_id: q.message.message_id,
          reply_markup: orderKeyboard(id, action),
        });
        return NextResponse.json({ ok: true });
      }
      if (kind === "r" && id && isCustomStatus(action)) {
        const result = await changeCustomRequestStatus(
          id,
          action,
          arg ? Number(arg) : undefined,
        );
        await answer(
          q.id,
          action === "ACCEPTED"
            ? result.emailSent
              ? "Принято, email отправлен"
              : "Принято. SMTP не настроен"
            : "Статус обновлён",
          action === "ACCEPTED" && !result.emailSent,
        );
        await telegram("editMessageReplyMarkup", {
          chat_id: chatId,
          message_id: q.message.message_id,
          reply_markup: requestKeyboard(id, action),
        });
        return NextResponse.json({ ok: true });
      }
      throw new Error("Неизвестная команда");
    } catch (e) {
      await answer(q.id, e instanceof Error ? e.message : "Ошибка", true);
    }
    return NextResponse.json({ ok: true });
  }
  const command = String(u.message?.text || "")
    .split(" ")[0]
    .toLowerCase();
  if (command === "/orders") await sendOrders(chatId);
  else if (command === "/requests") await sendRequests(chatId);
  else if (command === "/production")
    await telegram("sendMessage", {
      chat_id: chatId,
      text: `🖨 <b>Очередь печати</b>\n${await productionText()}`,
      parse_mode: "HTML",
      reply_markup: mainMenu,
    });
  else if (command === "/history") await sendOrders(chatId, true);
  else await menu(chatId);
  return NextResponse.json({ ok: true });
}
