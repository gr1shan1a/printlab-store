"use client";

import { useState, useRef, DragEvent, ChangeEvent, FormEvent } from "react";
import { PhoneInput } from "@/components/PhoneInput";
import { CaptchaField } from "@/components/CaptchaField";

interface MaterialOption {
  id: string;
  name: string;
  pricePerGram: number;
  temp: string;
  tag: string;
  desc: string;
}

const MATERIALS: MaterialOption[] = [
  {
    id: "PETG",
    name: "PETG",
    pricePerGram: 8,
    temp: "до 75°C",
    tag: "Топ выбор",
    desc: "Прочный, химстойкий и влагостойкий. Идеален для кронштейнов, деталей авто и бытовой техники.",
  },
  {
    id: "PLA",
    name: "PLA",
    pricePerGram: 7,
    temp: "до 55°C",
    tag: "Высокая точность",
    desc: "Максимальная детализация, биоразлагаемый. Идеален для прототипов, корпусов и макетов.",
  },
  {
    id: "ABS",
    name: "ABS / ASA",
    pricePerGram: 10,
    temp: "до 100°C",
    tag: "Термостойкий",
    desc: "Ударопрочный, стойкий к перепадам температур и УФ. Подходит для подкапотного пространства и улицы.",
  },
  {
    id: "TPU",
    name: "TPU / Flex",
    pricePerGram: 14,
    temp: "до 80°C",
    tag: "Эластичный",
    desc: "Резиноподобный, гасит вибрации. Идеален для втулок, демпферов, прокладок, заглушек.",
  },
  {
    id: "NYLON",
    name: "Nylon (PA)",
    pricePerGram: 18,
    temp: "до 120°C",
    tag: "Сверхпрочный",
    desc: "Экстремальная износостойкость и низкий коэффициент трения. Для шестерен и ответственных узлов.",
  },
];

const COLORS = [
  { name: "Чёрный", hex: "#1a1a1a" },
  { name: "Белый", hex: "#f0f0f0" },
  { name: "Серый / Графит", hex: "#7a7e85" },
  { name: "Оранжевый", hex: "#ff6b00" },
  { name: "Синий", hex: "#1e60d5" },
  { name: "Красный", hex: "#d92c2c" },
  { name: "Зелёный", hex: "#2aa843" },
];

export function PrintOrderCalculator() {
  const [tab, setTab] = useState<"model" | "estimate">("model");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("PETG");
  const [infill, setInfill] = useState<number>(30);
  const [color, setColor] = useState<string>("Чёрный");
  const [quantity, setQuantity] = useState<number>(1);
  const [estimatedGrams, setEstimatedGrams] = useState<number>(45);

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [modelUrl, setModelUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission state
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("+7");
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [captchaRequired, setCaptchaRequired] = useState<boolean>(false);
  const [captchaReset, setCaptchaReset] = useState<number>(0);

  const material = MATERIALS.find((m) => m.id === selectedMaterial) || MATERIALS[0];

  // Pricing calculation
  const baseCostPerGram = material.pricePerGram;
  const infillFactor = 0.7 + (infill / 100) * 0.6;
  const unitGrams = Math.round(estimatedGrams * infillFactor);
  const rawUnitPrice = Math.max(350, Math.round(unitGrams * baseCostPerGram + 120));

  // Quantity discounts
  let discountPercent = 0;
  if (quantity >= 25) discountPercent = 25;
  else if (quantity >= 10) discountPercent = 15;
  else if (quantity >= 5) discountPercent = 7;

  const unitPrice = Math.round(rawUnitPrice * (1 - discountPercent / 100));
  const totalPrice = unitPrice * quantity;

  // File handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (selected: File) => {
    const ext = selected.name.split(".").pop()?.toLowerCase();
    if (!["stl", "obj", "3mf", "step", "stp"].includes(ext || "")) {
      setErrorMessage("Поддерживаются форматы: STL, OBJ, 3MF, STEP");
      return;
    }
    if (selected.size > 26 * 1024 * 1024) {
      setErrorMessage("Размер файла не должен превышать 25 МБ");
      return;
    }
    setErrorMessage("");
    setFile(selected);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      let finalModelUrl = modelUrl;

      // 1. Upload file if attached
      if (file) {
        const uploadData = new FormData();
        uploadData.append("file", file);
        const uploadRes = await fetch("/api/upload/model", {
          method: "POST",
          body: uploadData,
        });
        const uploadJson = await uploadRes.json().catch(() => null);
        if (!uploadRes.ok) {
          throw new Error(uploadJson?.error || "Ошибка при загрузке 3D-файла");
        }
        finalModelUrl = uploadJson.url;
      }

      // 2. Format details string
      const detailsMsg = [
        `[3D-печать на заказ]`,
        `Материал: ${material.name} (${color})`,
        `Заполнение: ${infill}% | Ориент. вес детали: ~${unitGrams} г`,
        `Количество: ${quantity} шт`,
        `Ориентировочный расчёт: ${totalPrice.toLocaleString("ru-RU")} ₽`,
        file ? `Файл: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} МБ)` : "",
        modelUrl ? `Ссылка на модель: ${modelUrl}` : "",
        message ? `Комментарий клиента: ${message}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      // 3. Submit request
      const contactPayload: Record<string, unknown> = {
        name,
        email,
        phone: phone === "+7" ? "" : phone,
        message: detailsMsg,
        mode: (file || modelUrl) ? "READY_MODEL" : "CUSTOM",
        modelUrl: finalModelUrl || undefined,
        reference: file ? file.name : (modelUrl || `Расчёт: ${material.name}, ${quantity} шт`),
        quantity,
      };

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactPayload),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        if (body?.captchaRequired) {
          setCaptchaRequired(true);
          setCaptchaReset((c) => c + 1);
        }
        throw new Error(body?.error || "Проверьте введённые данные и попробуйте снова.");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Не удалось отправить заявку");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="calculator-success-card">
        <div className="calc-success-icon">✓</div>
        <h3>Заявка на 3D-печать принята!</h3>
        <p className="lead">
          Мы проверили геометрию вашей задачи. Инженер свяжется с вами по указанным контактам
          (email: <b>{email}</b>{phone !== "+7" ? `, тел: ${phone}` : ""}) в течение 15 минут в рабочее время
          для согласования финальной цены, раскладки и запуска принтера.
        </p>
        <div className="calc-summary-badge">
          <span>Материал: <b>{material.name}</b></span>
          <span>Цвет: <b>{color}</b></span>
          <span>Количество: <b>{quantity} шт</b></span>
          <span>Ориент. бюджет: <b>{totalPrice.toLocaleString("ru-RU")} ₽</b></span>
        </div>
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            setSubmitted(false);
            setFile(null);
            setMessage("");
          }}
        >
          Рассчитать ещё одну деталь
        </button>
      </div>
    );
  }

  return (
    <div className="calculator-widget" id="calculator">
      {/* Mode Switcher */}
      <div className="calc-mode-strip">
        <button
          type="button"
          className={`calc-mode-btn ${tab === "model" ? "active" : ""}`}
          onClick={() => setTab("model")}
        >
          <span className="mode-num">01</span>
          <div>
            <b>Загрузить 3D-файл</b>
            <small>STL, STEP, 3MF, OBJ до 25 МБ</small>
          </div>
        </button>
        <button
          type="button"
          className={`calc-mode-btn ${tab === "estimate" ? "active" : ""}`}
          onClick={() => setTab("estimate")}
        >
          <span className="mode-num">02</span>
          <div>
            <b>Быстрый расчёт стоимости</b>
            <small>По весу, габаритам и материалу</small>
          </div>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="calc-grid">
        <div className="calc-main-panel">
          {/* File Upload / Link Area */}
          {tab === "model" ? (
            <div className="calc-section">
              <label className="calc-section-title">
                1. Файл модели для печати <span className="req">*</span>
              </label>

              {!file ? (
                <div
                  className={`calc-dropzone ${isDragging ? "dragging" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".stl,.obj,.3mf,.step,.stp"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                  <div className="dropzone-icon">⭳</div>
                  <div className="dropzone-copy">
                    <strong>Перетащите 3D-модель сюда</strong>
                    <span>или нажмите для выбора файла на устройстве</span>
                  </div>
                  <div className="dropzone-formats">
                    <span className="badge">.STL</span>
                    <span className="badge">.STEP / .STP</span>
                    <span className="badge">.3MF</span>
                    <span className="badge">.OBJ</span>
                    <span className="badge-sub">до 25 МБ</span>
                  </div>
                </div>
              ) : (
                <div className="calc-file-selected">
                  <div className="file-info">
                    <div className="file-icon">📦</div>
                    <div>
                      <b>{file.name}</b>
                      <span>{(file.size / 1024 / 1024).toFixed(2)} МБ · Готов к расчёту</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="calc-file-remove"
                    onClick={removeFile}
                    title="Удалить файл"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="calc-or-divider">или укажите ссылку на модель</div>
              <input
                type="url"
                className="calc-input"
                placeholder="https://printables.com/model/... или Яндекс.Диск / Google Drive"
                value={modelUrl}
                onChange={(e) => setModelUrl(e.target.value)}
              />
            </div>
          ) : (
            <div className="calc-section">
              <label className="calc-section-title">1. Примерный вес детали</label>
              <div className="calc-weight-slider">
                <div className="slider-header">
                  <span>Оценочный вес:</span>
                  <b>{estimatedGrams} грамм</b>
                </div>
                <input
                  type="range"
                  min="5"
                  max="450"
                  step="5"
                  value={estimatedGrams}
                  onChange={(e) => setEstimatedGrams(Number(e.target.value))}
                  className="calc-range"
                />
                <div className="slider-hints">
                  <span>5г (клипса/заглушка)</span>
                  <span>50г (кронштейн)</span>
                  <span>200г (корпус прибора)</span>
                  <span>450г (крупная деталь)</span>
                </div>
              </div>
            </div>
          )}

          {/* Material Selector */}
          <div className="calc-section">
            <label className="calc-section-title">2. Выберите рабочий пластик</label>
            <div className="calc-materials-grid">
              {MATERIALS.map((m) => (
                <div
                  key={m.id}
                  className={`calc-mat-card ${selectedMaterial === m.id ? "active" : ""}`}
                  onClick={() => setSelectedMaterial(m.id)}
                >
                  <div className="mat-head">
                    <b>{m.name}</b>
                    <span className="mat-badge">{m.tag}</span>
                  </div>
                  <div className="mat-rate">
                    <strong>от {m.pricePerGram} ₽</strong> / грамм
                  </div>
                  <p className="mat-desc">{m.desc}</p>
                  <div className="mat-meta">
                    <span>Температура: {m.temp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Infill & Color Row */}
          <div className="calc-section calc-two-col">
            <div>
              <label className="calc-section-title">3. Плотность заполнения (Infill)</label>
              <div className="calc-pill-group">
                {[
                  { val: 15, label: "15% (декор)" },
                  { val: 30, label: "30% (стандарт)" },
                  { val: 60, label: "60% (прочный)" },
                  { val: 100, label: "100% (монолит)" },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    className={`calc-pill ${infill === item.val ? "active" : ""}`}
                    onClick={() => setInfill(item.val)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="calc-section-title">4. Цвет пластика</label>
              <div className="calc-colors-strip">
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    className={`color-dot-btn ${color === c.name ? "active" : ""}`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => setColor(c.name)}
                    title={c.name}
                  >
                    {color === c.name && <span className="color-check">✓</span>}
                  </button>
                ))}
              </div>
              <small className="muted" style={{ display: "block", marginTop: 6 }}>
                Выбран: <b>{color}</b>
              </small>
            </div>
          </div>

          {/* Additional details */}
          <div className="calc-section">
            <label className="calc-section-title">5. Пожелания и требования к точности</label>
            <textarea
              className="calc-textarea"
              placeholder="Укажите назначение детали, требования к прочности, сопрягаемые размеры, резьбовые вставки..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Sidebar Summary & Order Action */}
        <aside className="calc-sidebar">
          <div className="calc-card sticky-calc">
            <div className="calc-card-eyebrow">Расчёт онлайн</div>
            <h3 className="calc-card-title">Итог заказа</h3>

            <div className="calc-line-item">
              <span>Технология печати:</span>
              <b>FDM / FFF (Bambu Lab)</b>
            </div>
            <div className="calc-line-item">
              <span>Материал:</span>
              <b>{material.name} ({color})</b>
            </div>
            <div className="calc-line-item">
              <span>Заполнение:</span>
              <b>{infill}%</b>
            </div>
            <div className="calc-line-item">
              <span>Ориент. вес 1 шт:</span>
              <b>~{unitGrams} г</b>
            </div>

            <div className="calc-qty-control">
              <span>Тираж:</span>
              <div className="stepper">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))
                  }
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                >
                  +
                </button>
              </div>
            </div>

            {discountPercent > 0 && (
              <div className="calc-discount-badge">
                🎉 Скидка за объём: <b>-{discountPercent}%</b>
              </div>
            )}

            <div className="calc-price-total">
              <div>
                <small>Ориентировочная сумма:</small>
                <strong>{totalPrice.toLocaleString("ru-RU")} ₽</strong>
              </div>
              <div className="calc-unit-rate">
                {quantity > 1 && `${unitPrice.toLocaleString("ru-RU")} ₽ / шт`}
              </div>
            </div>

            <div className="calc-features-list">
              <div className="calc-feat">⚡ Срок готовности: <b>1–2 рабочих дня</b></div>
              <div className="calc-feat">🎯 Точность печати: <b>±0.1–0.2 мм</b></div>
              <div className="calc-feat">📦 Доставка: <b>СДЭК / самовывоз</b></div>
            </div>

            {/* Quick Contact Form */}
            <div className="calc-client-fields">
              <div className="calc-field">
                <label>Ваше имя <span className="req">*</span></label>
                <input
                  required
                  minLength={2}
                  type="text"
                  placeholder="Иван"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="calc-field">
                <label>Email для подтверждения <span className="req">*</span></label>
                <input
                  required
                  type="email"
                  placeholder="ivan@example.ru"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="calc-field">
                <label>Телефон / Мессенджер</label>
                <PhoneInput value={phone} onChange={setPhone} />
              </div>

              {captchaRequired && <CaptchaField resetKey={captchaReset} />}

              {errorMessage && <div className="calc-error">{errorMessage}</div>}

              <button
                type="submit"
                className="btn accent calc-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Отправляем данные…" : "Запустить расчёт и печать →"}
              </button>

              <small className="calc-terms-note">
                Нажимая кнопку, вы соглашаетесь с условиями сервиса и обработкой персональных данных.
              </small>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
