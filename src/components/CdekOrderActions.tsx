"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type OrderProps = {
  id: string;
  number: number;
  paymentStatus: string;
  deliveryMethod: string;
  deliveryProvider?: string | null;
  deliveryPointCode?: string | null;
  cdekOrderUuid?: string | null;
  cdekTrackingNumber?: string | null;
  cdekStatus?: string | null;
};

export function CdekOrderActions({ order }: { order: OrderProps }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (order.deliveryMethod !== "delivery") {
    return <span className="muted" style={{ fontSize: 13 }}>Самовывоз</span>;
  }

  async function handleCdekAction(action: "create" | "sync") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/order/${order.id}/cdek`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Не удалось выполнить операцию");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка запроса");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 6, fontSize: 13, marginTop: 4 }}>
      {order.deliveryPointCode && (
        <div>
          <b>ПВЗ:</b> <code style={{ background: "#f0f2eb", padding: "2px 5px", borderRadius: 4 }}>{order.deliveryPointCode}</code>
        </div>
      )}

      {order.cdekTrackingNumber ? (
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ color: "#2e7d32", fontWeight: 700 }}>СДЭК:</span>
            <a
              href={`https://my.cdek.ru/lkfl/order/${encodeURIComponent(order.cdekTrackingNumber)}/`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontWeight: 600, textDecoration: "underline", color: "#1976d2" }}
              title="Открыть заказ в личном кабинете СДЭК"
            >
              № {order.cdekTrackingNumber} ↗
            </a>
            <a
              href={`https://www.cdek.ru/ru/tracking?order_id=${encodeURIComponent(order.cdekTrackingNumber)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: "var(--muted)", textDecoration: "underline" }}
              title="Публичное отслеживание"
            >
              (отслеживание)
            </a>
            {order.cdekStatus && (
              <span style={{ background: "#e8f5e9", color: "#2e7d32", fontSize: 11, padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                {order.cdekStatus}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
            <a
              href={`/api/admin/order/${order.id}/cdek/print?type=orders`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn secondary"
              style={{ padding: "4px 8px", fontSize: 11, textDecoration: "none" }}
              title="Скачать накладную / квитанцию к заказу"
            >
              📄 Накладная PDF
            </a>
            <a
              href={`/api/admin/order/${order.id}/cdek/print?type=barcodes`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn secondary"
              style={{ padding: "4px 8px", fontSize: 11, textDecoration: "none" }}
              title="Скачать ШК-наклейку для посылки"
            >
              🏷️ Штрихкод PDF
            </a>
            <button
              type="button"
              onClick={() => handleCdekAction("sync")}
              disabled={busy}
              className="btn"
              style={{ padding: "4px 8px", fontSize: 11, background: "#f5f5f5", border: "1px solid #ccc" }}
              title="Проверить статус отправления в СДЭК"
            >
              {busy ? "..." : "🔄 Обновить"}
            </button>
          </div>
        </div>
      ) : order.cdekOrderUuid ? (
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: "#e65100", fontSize: 12 }}>⏳ Зарегистрирован в СДЭК, ждём трек-номер</span>
          <button
            type="button"
            onClick={() => handleCdekAction("sync")}
            disabled={busy}
            className="btn secondary"
            style={{ padding: "4px 8px", fontSize: 12 }}
          >
            {busy ? "Запрос..." : "🔄 Получить трек-номер"}
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => handleCdekAction("create")}
            disabled={busy}
            className="btn accent"
            style={{ padding: "5px 10px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            {busy ? "Оформляем..." : "📦 Оформить в СДЭК"}
          </button>
          {order.paymentStatus !== "PAID" && (
            <div style={{ fontSize: 11, color: "#d32f2f", marginTop: 2 }}>
              ⚠️ Заказ ещё не оплачен
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ color: "#d32f2f", fontSize: 11, background: "#ffebee", padding: "4px 8px", borderRadius: 4, marginTop: 2 }}>
          {error}
        </div>
      )}
    </div>
  );
}
