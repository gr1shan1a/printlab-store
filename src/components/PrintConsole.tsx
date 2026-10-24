"use client";

import { useEffect, useRef, useState } from "react";
import type { LibraryPrintFile } from "@/lib/print-library";

type Printer = { gcodeState?: string; file?: string; percent?: number; remainingMinutes?: number; layer?: number; totalLayers?: number; nozzleTemp?: number; bedTemp?: number; errorCode?: number; updatedAt?: string };
const formatTime = (minutes?: number) => minutes === undefined || minutes === null ? "—" : minutes < 60 ? `${minutes} мин` : `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`;
const stateText = (state?: string) => ({ RUNNING: "Печатает", PREPARE: "Подготовка", PAUSE: "На паузе", FAILED: "Печать прервана", FINISH: "Свободен", IDLE: "Свободен" }[state || ""] || state || "Нет данных");

export function PrintConsole({ initialFiles }: { initialFiles: LibraryPrintFile[] }) {
  const [files, setFiles] = useState(initialFiles);
  const [selected, setSelected] = useState(initialFiles[0]?.name || "");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState<"upload" | "print" | null>(null);
  const [message, setMessage] = useState("");
  const [printer, setPrinter] = useState<Printer | null>(null);
  const [printerError, setPrinterError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function refreshStatus() {
    const response = await fetch("/api/admin/print/status", { cache: "no-store" });
    const body = await response.json().catch(() => null);
    if (response.ok) { setPrinter(body); setPrinterError(""); }
    else setPrinterError(body?.error || "Статус A1 недоступен");
  }
  useEffect(() => { refreshStatus(); const timer = window.setInterval(refreshStatus, 10_000); return () => window.clearInterval(timer); }, []);

  async function upload() {
    const file = input.current?.files?.[0]; if (!file) return;
    setBusy("upload"); setMessage("");
    const form = new FormData(); form.set("file", file); form.set("displayName", displayName);
    const response = await fetch("/api/admin/print-files", { method: "POST", body: form });
    const body = await response.json().catch(() => null); setBusy(null);
    if (!response.ok) return setMessage(body?.error || "Не удалось загрузить файл");
    const next = [{ ...body, modifiedAt: new Date().toISOString() }, ...files];
    setFiles(next); setSelected(body.name); setDisplayName(""); if (input.current) input.current.value = "";
    setMessage("Файл добавлен в библиотеку.");
  }
  async function print() {
    const file = files.find((item) => item.name === selected);
    if (!file || !confirm(`Запустить печать файла «${file.label}»?`)) return;
    setBusy("print"); setMessage("");
    const response = await fetch("/api/admin/print/start", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: selected }) });
    const body = await response.json().catch(() => null); setBusy(null);
    setMessage(response.ok ? body?.message || "Команда отправлена." : body?.error || "Не удалось запустить печать");
    if (response.ok) window.setTimeout(refreshStatus, 4_000);
  }
  return <section className="card" style={{ marginBottom: 28 }}><div className="eyebrow">Bambu A1</div><h2>Запуск готового файла</h2><p className="muted">Библиотека принимает только подготовленные в Bambu Studio <code>.gcode.3mf</code>. Файл можно назвать как угодно — техническое имя скрыто.</p>
    <div className="form-row"><input ref={input} type="file" accept=".gcode.3mf" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file && !displayName) setDisplayName(file.name.replace(/\.gcode\.3mf$/i, "")); }} /><input value={displayName} maxLength={100} placeholder="Название в библиотеке" onChange={(event) => setDisplayName(event.target.value)} /><button type="button" disabled={busy !== null} onClick={upload}>{busy === "upload" ? "Загружаю…" : "Добавить файл"}</button></div>
    {files.length ? <><label className="field-label">Файл для быстрого запуска<select value={selected} disabled={busy !== null} onChange={(event) => setSelected(event.target.value)}>{files.map((file) => <option key={file.name} value={file.name}>{file.label} · {(file.size / 1024 / 1024).toFixed(1)} МБ</option>)}</select></label><button type="button" className="primary" disabled={busy !== null} onClick={print}>{busy === "print" ? "Передаю на A1…" : "Запустить печать"}</button></> : <p className="muted">Библиотека пока пуста.</p>}{message && <p className="notice">{message}</p>}
    <div className="production-heading" style={{ marginTop: 24 }}><div><div className="eyebrow">Статус принтера</div><h3>{stateText(printer?.gcodeState)}</h3><p className="muted">Обновляется каждые 10 секунд.</p></div><button type="button" onClick={refreshStatus}>Обновить</button></div>
    {printer ? <div className="admin-table-wrap"><table><tbody><tr><th>Файл</th><td>{printer.file || "—"}</td><th>Готово</th><td>{printer.percent ?? "—"}%</td></tr><tr><th>Осталось</th><td>{formatTime(printer.remainingMinutes)}</td><th>Слой</th><td>{printer.layer && printer.totalLayers ? `${printer.layer} / ${printer.totalLayers}` : "—"}</td></tr><tr><th>Сопло / стол</th><td>{printer.nozzleTemp ?? "—"}°C / {printer.bedTemp ?? "—"}°C</td><th>Ошибка</th><td>{printer.errorCode || "нет"}</td></tr></tbody></table></div> : <p className="muted">{printerError || "Запрашиваю состояние A1…"}</p>}
  </section>;
}
