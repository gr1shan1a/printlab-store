"use client";

import { useRef, useState } from "react";

export type PrintFile = { name: string; size: number; modifiedAt: string };

function label(name: string) {
  return name.replace(/-[0-9a-f]{8}-[0-9a-f-]{27}\.gcode\.3mf$/i, ".gcode.3mf");
}

export function PrintFileLauncher({ initialFiles }: { initialFiles: PrintFile[] }) {
  const [files, setFiles] = useState(initialFiles);
  const [selected, setSelected] = useState(initialFiles[0]?.name || "");
  const [busy, setBusy] = useState<"upload" | "print" | null>(null);
  const [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function upload() {
    const file = input.current?.files?.[0];
    if (!file) return;
    setBusy("upload"); setMessage("");
    const form = new FormData(); form.set("file", file);
    const response = await fetch("/api/admin/print-files", { method: "POST", body: form });
    const body = await response.json().catch(() => null);
    setBusy(null);
    if (!response.ok) return setMessage(body?.error || (response.status === 413 ? "Файл превышает допустимый размер." : "Не удалось загрузить файл"));
    const next = [{ ...body, modifiedAt: new Date().toISOString() }, ...files];
    setFiles(next); setSelected(body.name); if (input.current) input.current.value = "";
    setMessage("Файл добавлен в библиотеку.");
  }

  async function print() {
    if (!selected || !confirm(`Запустить печать файла «${label(selected)}»?`)) return;
    setBusy("print"); setMessage("");
    const response = await fetch("/api/admin/print/start", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: selected }) });
    const body = await response.json().catch(() => null);
    setBusy(null); setMessage(response.ok ? body?.message || "Команда отправлена." : body?.error || "Не удалось запустить печать");
  }

  return <section className="card" style={{ marginBottom: 28 }}><div className="eyebrow">Bambu A1</div><h2>Запуск готового файла</h2><p className="muted">Поддерживаются только уже нарезанные в Bambu Studio файлы <code>.gcode.3mf</code>. После подтверждения Raspberry проверит, свободен ли A1, и запустит выбранный файл.</p><div className="form-row"><input ref={input} type="file" accept=".gcode.3mf" /><button type="button" disabled={busy !== null} onClick={upload}>{busy === "upload" ? "Загружаю…" : "Добавить файл"}</button></div>{files.length ? <><label className="field-label">Файл для печати<select value={selected} disabled={busy !== null} onChange={(event) => setSelected(event.target.value)}>{files.map((file) => <option key={file.name} value={file.name}>{label(file.name)} · {(file.size / 1024 / 1024).toFixed(1)} МБ</option>)}</select></label><button type="button" className="primary" disabled={busy !== null} onClick={print}>{busy === "print" ? "Передаю на A1…" : "Запустить печать"}</button></> : <p className="muted">Библиотека пока пуста.</p>}{message && <p className="notice">{message}</p>}</section>;
}
