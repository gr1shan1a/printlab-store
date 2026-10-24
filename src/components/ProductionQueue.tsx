"use client";

import { useEffect, useRef, useState } from "react";
import type { LibraryPrintFile } from "@/lib/print-library";
import { statusLabel } from "@/lib/status";

type ProductionStatus = "QUEUED" | "PRINTING" | "COMPLETED" | "FAILED";
type Row = { id: string; orderNumber: number | null; requestName: string | null; productName: string; variantLabel: string; quantity: number; batchSize: number; printRuns: number; status: ProductionStatus; createdAt: string; printFileName: string | null };
const statuses: ProductionStatus[] = ["QUEUED", "PRINTING", "COMPLETED", "FAILED"];
const archived = (status: ProductionStatus) => status === "COMPLETED" || status === "FAILED";
const date = (value: string) => new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export function ProductionQueue({ initialRows, files }: { initialRows: Row[]; files: LibraryPrintFile[] }) {
  const [rows, setRows] = useState(initialRows), [view, setView] = useState<"active" | "archive">("active"), [busy, setBusy] = useState<string | null>(null), [error, setError] = useState(""), [lingering, setLingering] = useState<Record<string, "active" | "archive">>({});
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current.clear(); }, []);
  const visible = rows.filter((row) => (view === "archive" ? archived(row.status) : !archived(row.status)) || lingering[row.id] === view);
  async function change(id: string, status: ProductionStatus) {
    setBusy(id); setError(""); const response = await fetch(`/api/admin/production/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) }); const body = await response.json().catch(() => null); setBusy(null);
    if (!response.ok) return setError(body?.error || "Не удалось изменить статус");
    const oldStatus = rows.find((row) => row.id === id)?.status; setRows((current) => current.map((row) => row.id === id ? { ...row, status } : row));
    const previous = timers.current.get(id); if (previous) clearTimeout(previous); const moved = oldStatus !== undefined && archived(oldStatus) !== archived(status);
    if (moved) { const source = archived(oldStatus) ? "archive" : "active"; setLingering((current) => ({ ...current, [id]: source })); timers.current.set(id, setTimeout(() => { setLingering((current) => { const next = { ...current }; delete next[id]; return next; }); timers.current.delete(id); }, 3000)); }
  }
  async function assign(id: string, name: string) {
    if (!name) return; setBusy(id); setError(""); const response = await fetch(`/api/admin/production/${id}/print-file`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) }); const body = await response.json().catch(() => null); setBusy(null);
    if (!response.ok) return setError(body?.error || "Не удалось выбрать файл"); setRows((current) => current.map((row) => row.id === id ? { ...row, printFileName: name } : row));
  }
  async function start(row: Row) {
    const file = files.find((item) => item.name === row.printFileName); if (!file) return setError("Сначала выберите файл из библиотеки");
    if (!confirm(`Запустить «${file.label}» для ${row.orderNumber ? `заказа #${row.orderNumber}` : "заявки"}?`)) return;
    setBusy(row.id); setError(""); const response = await fetch(`/api/admin/production/${row.id}/start`, { method: "POST" }); const body = await response.json().catch(() => null); setBusy(null);
    if (!response.ok) return setError(body?.error || "Не удалось запустить печать"); setRows((current) => current.map((item) => item.id === row.id ? { ...item, status: "PRINTING" } : item));
  }
  return <><div className="eyebrow">Приоритет производства</div><div className="production-heading"><div><h2>{view === "active" ? "Нужно напечатать" : "Архив печати"}</h2><p className="muted">У каждой задачи можно выбрать готовый файл из библиотеки и подтвердить запуск.</p></div><div className="segmented production-switch"><button type="button" className={view === "active" ? "active" : ""} onClick={() => setView("active")}>Активные</button><button type="button" className={view === "archive" ? "active" : ""} onClick={() => setView("archive")}>Архив</button></div></div>{error && <div className="notice error">{error}</div>}{visible.length ? <div className="admin-table-wrap production-table-wrap"><table><thead><tr><th>Заказ / заявка</th><th>Когда создан</th><th>Изделие</th><th>Запуски</th><th>Файл из библиотеки</th><th>Статус</th></tr></thead><tbody>{visible.map((row) => <tr key={row.id}><td>{row.orderNumber ? <><b>#{row.orderNumber}</b><small>{row.requestName || "Заказ"}</small></> : <><b>Заявка</b><small>{row.requestName}</small></>}</td><td><small>{date(row.createdAt)}</small></td><td><b>{row.productName}</b><small className="production-description">{row.variantLabel} · {row.quantity} шт.</small></td><td><b>{row.printRuns}</b><small>{row.batchSize > 1 ? `по ${row.batchSize} шт. на платформе` : "по 1 шт."}</small></td><td><select value={row.printFileName || ""} disabled={busy === row.id || !files.length} onChange={(event) => assign(row.id, event.target.value)}><option value="">{files.length ? "Выберите файл" : "Библиотека пуста"}</option>{files.map((file) => <option key={file.name} value={file.name}>{file.label}</option>)}</select>{row.printFileName && <button type="button" className="primary" disabled={busy === row.id} style={{ marginTop: 8 }} onClick={() => start(row)}>{busy === row.id ? "Запускаю…" : "Запустить"}</button>}</td><td><div className="production-status"><select disabled={busy === row.id} value={row.status} onChange={(event) => change(row.id, event.target.value as ProductionStatus)}>{statuses.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}</select><small>{statusLabel[row.status]}</small></div></td></tr>)}</tbody></table></div> : <div className="empty"><h3>{view === "active" ? "Очередь печати пуста" : "В архиве пока ничего нет"}</h3></div>}</>;
}
