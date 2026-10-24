async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN,
    secret = process.env.TELEGRAM_WEBHOOK_SECRET,
    url = process.env.TELEGRAM_WEBHOOK_URL;
  if (!token || !secret || !url)
    throw new Error(
      "Заполните TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET и TELEGRAM_WEBHOOK_URL",
    );
  if (!url.startsWith("https://"))
    throw new Error("Telegram webhook требует публичный HTTPS URL");
  const api = `https://api.telegram.org/bot${token}`;
  async function call(method: string, body: unknown) {
    const r = await fetch(`${api}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await r.json()) as { ok?: boolean };
    if (!r.ok || !data.ok)
      throw new Error(`${method}: ${JSON.stringify(data)}`);
    return data;
  }
  await call("setWebhook", {
    url,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: false,
  });
  await call("setMyCommands", {
    commands: [
      { command: "orders", description: "Текущие заказы" },
      { command: "requests", description: "Индивидуальные заявки" },
      { command: "production", description: "Очередь печати" },
      { command: "history", description: "История заказов" },
      { command: "help", description: "Все команды" },
    ],
  });
  console.log("Telegram webhook и команды настроены");
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
