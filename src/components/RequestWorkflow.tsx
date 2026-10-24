"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
const labels: Record<string, string> = {
  NEW: "🆕 Новая",
  REVIEWING: "👀 На рассмотрении",
  DEFERRED: "⏰ Отложена",
  ACCEPTED: "✅ Принята",
  IN_PRODUCTION: "🖨 В печати",
  READY: "📦 Готова",
  COMPLETED: "🏁 Завершена",
  DECLINED: "❌ Отклонена",
};
export function RequestWorkflow({
  id,
  status,
  promisedDays,
  mode,
}: {
  id: string;
  status: string;
  promisedDays: number | null;
  mode: string | null;
}) {
  const router = useRouter(),
    [days, setDays] = useState(promisedDays || 3),
    [busy, setBusy] = useState(false),
    [note, setNote] = useState("");
  async function change(next: string) {
    setBusy(true);
    setNote("");
    const r = await fetch(`/api/admin/request/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: next,
          promisedDays: next === "ACCEPTED" ? days : undefined,
        }),
      }),
      body = await r.json();
    setBusy(false);
    if (!r.ok) return setNote(body.error || "Ошибка");
    if (next === "ACCEPTED")
      setNote(
        body.emailSent ? "Email отправлен" : "Принято, но SMTP не настроен",
      );
    router.refresh();
  }
  return (
    <div className="request-workflow">
      <b>{labels[status] || status}</b>
      {status === "NEW" && (
        <div className="mini-actions">
          <button disabled={busy} onClick={() => change("REVIEWING")}>
            Взять в работу
          </button>
          <button disabled={busy} onClick={() => change("DEFERRED")}>
            Позже
          </button>
        </div>
      )}
      {status === "DEFERRED" && (
        <div className="mini-actions">
          <button disabled={busy} onClick={() => change("REVIEWING")}>
            Вернуться
          </button>
          <button disabled={busy} onClick={() => change("DECLINED")}>
            Отклонить
          </button>
        </div>
      )}
      {status === "REVIEWING" && (
        <>
          <label className="days">
            Срок{" "}
            <input
              type="number"
              min="1"
              max="60"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />{" "}
            дней
          </label>
          <div className="mini-actions">
            <button
              className="ok"
              disabled={busy}
              onClick={() => change("ACCEPTED")}
            >
              Подтвердить
            </button>
            <button disabled={busy} onClick={() => change("DEFERRED")}>
              Позже
            </button>
            <button disabled={busy} onClick={() => change("DECLINED")}>
              Отклонить
            </button>
          </div>
        </>
      )}
      {status === "ACCEPTED" && (
        mode === "READY_MODEL" ? <div className="workflow-hint">🖨 Добавлена в очередь печати</div> : <button disabled={busy} onClick={() => change("IN_PRODUCTION")}>
          Модель согласована — в печать
        </button>
      )}
      {status === "IN_PRODUCTION" && (
        <button disabled={busy} onClick={() => change("READY")}>
          📦 Готово
        </button>
      )}
      {status === "READY" && (
        <button disabled={busy} onClick={() => change("COMPLETED")}>
          🏁 Завершить
        </button>
      )}
      {note && <small>{note}</small>}
    </div>
  );
}
