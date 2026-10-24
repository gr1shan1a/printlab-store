"use client";

import { useEffect, useState } from "react";
import { CaptchaField } from "@/components/CaptchaField";
import { PhoneInput } from "@/components/PhoneInput";

export function RequestForm() {
  const [state, setState] = useState("");
  const [mode, setMode] = useState<"CUSTOM" | "READY_MODEL">("CUSTOM");
  const [reference, setReference] = useState("");
  const [phone, setPhone] = useState("+7");
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const choose = (event: Event) => {
      const detail = (event as CustomEvent<{ reference: string }>).detail;
      setMode("CUSTOM");
      setReference(detail.reference);
      setState("Работа добавлена как референс — опишите, что хотите изменить.");
    };
    window.addEventListener("choose-gallery-item", choose);
    return () => window.removeEventListener("choose-gallery-item", choose);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setState("");
    const formData = new FormData(form);
    const data = Object.fromEntries(formData) as Record<string, string | File>;
    const modelFile = formData.get("modelFile");
    delete data.modelFile;
    if (data.phone === "+7") data.phone = "";

    try {
      if (mode === "READY_MODEL" && modelFile instanceof File && modelFile.size > 0) {
        setUploading(true);
        setState("Загружаем модель…");
        const upload = new FormData();
        upload.set("file", modelFile);
        const response = await fetch("/api/upload/model", { method: "POST", body: upload });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error || "Не удалось загрузить модель");
        data.modelUrl = body.url;
      }

      setState("Отправляем заявку…");
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setCaptchaRequired(Boolean(body?.captchaRequired));
        if (body?.captchaRequired) setCaptchaReset((value) => value + 1);
        setState(body?.error || "Проверьте поля и попробуйте снова.");
        return;
      }
      setState("Заявка создана. После подтверждения срок придёт на email.");
      setCaptchaRequired(false);
      setCaptchaReset((value) => value + 1);
      form.reset();
      setMode("CUSTOM");
      setReference("");
      setPhone("+7");
    } catch (error) {
      setState(error instanceof Error ? error.message : "Не удалось отправить заявку.");
    } finally {
      setUploading(false);
    }
  }

  return <form className="form request-form" onSubmit={submit}>
    <div className="two"><div className="field"><label>Ваше имя <i className="required-mark">*</i></label><input name="name" required minLength={2} /></div><div className="field"><label>Телефон</label><PhoneInput value={phone} onChange={setPhone} /></div></div>
    <div className="field"><label>Email для подтверждения <i className="required-mark">*</i></label><input name="email" type="email" required placeholder="you@example.ru" /></div>
    <div className="field"><label>Что нужно сделать? <i className="required-mark">*</i></label><div className="request-mode"><button type="button" className={mode === "CUSTOM" ? "active" : ""} onClick={() => setMode("CUSTOM")}><b>Подобрать или разработать</b><small>Есть идея, фото или похожее изделие</small></button><button type="button" className={mode === "READY_MODEL" ? "active" : ""} onClick={() => setMode("READY_MODEL")}><b>Только распечатать</b><small>У меня уже есть готовая 3D-модель</small></button></div><input type="hidden" name="mode" value={mode} /></div>
    {mode === "READY_MODEL" ? <div className="model-source"><div className="field"><label>Загрузите 3D-модель</label><input name="modelFile" type="file" accept=".stl,.obj,.3mf,model/stl,application/vnd.ms-package.3dmanufacturing-3dmodel+xml" /><small>STL, OBJ или 3MF · до 25 МБ</small></div><div className="model-source-or">или</div><div className="field"><label>Ссылка на модель</label><input name="modelUrl" type="url" placeholder="https://printables.com/model/…" /><small>Достаточно загрузить файл или указать ссылку.</small></div></div> : <div className="field"><label>Референсы</label><input name="reference" value={reference} onChange={event => setReference(event.target.value)} placeholder="Ссылка на фото, похожее изделие или краткое описание" /><small>Можно выбрать работу из галереи ниже — она появится здесь автоматически.</small></div>}
    <div className="field"><label>Описание пожелания <i className="required-mark">*</i></label><textarea name="message" required minLength={10} placeholder={mode === "READY_MODEL" ? "Материал, цвет, масштаб и важные детали…" : "Что должно получиться, размеры, назначение и важные детали…"} /></div>
    <div className="field"><label>Количество <i className="required-mark">*</i></label><input name="quantity" type="number" min="1" max="99" defaultValue="1" required /></div>
    {captchaRequired && <CaptchaField resetKey={captchaReset} />}
    <button className="btn accent" disabled={uploading}>{uploading ? "Загружаем файл…" : "Отправить заявку"}</button>
    {state && <div className="notice">{state}</div>}
  </form>;
}
