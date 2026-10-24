"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function StatusForm({ id, status, kind }: { id: string; status: string; kind: "order" | "production" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function change(value: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/${kind}/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: value }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Не удалось изменить статус");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Ошибка соединения");
    } finally { setBusy(false); }
  }
  const values = kind === "order"
    ? [...(status === "PAID" ? ["PAID"] : []), "NEW", "CONFIRMED", "WAITING_FOR_PRINT", "PRINTING", "READY", "SHIPPED", "COMPLETED", "CANCELLED"]
    : ["QUEUED", "PRINTING", "COMPLETED", "FAILED"];
  return <div><select aria-label="Статус заказа" disabled={busy} value={status} onChange={event => change(event.target.value)}>
    {values.map(value => <option key={value} value={value} disabled={kind === "order" && (value === "PAID" || value === "NEW")}>{kind === "order" && value === "NEW" ? "NOT PAID" : value}</option>)}
  </select>{error && <p role="alert" className="notice error">{error}</p>}</div>;
}
