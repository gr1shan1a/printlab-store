import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Реквизиты и правовая информация · FORM3D",
  description: "Официальные реквизиты, ИНН и юридическая информация лаборатории 3D-печати FORM3D.",
  alternates: {
    canonical: "/requisites",
  },
};

export default function Requisites() {
  const phone = process.env.STORE_PHONE || "+7 980 710-61-71";
  const email = process.env.STORE_EMAIL || "form3d-store@yandex.com";
  const telegram = process.env.STORE_TELEGRAM || "https://t.me/Gr1shania";
  const inn = process.env.STORE_INN || "402500000000";

  return (
    <article className="container section">
      <div className="breadcrumbs-bar">
        <Link href="/">Главная</Link>
        <span>/</span>
        <span className="current">Реквизиты</span>
      </div>

      <div className="eyebrow">FORM3D · Правовая информация</div>
      <h1>Реквизиты и контакты</h1>
      <p className="lead">Официальные данные для оформления договоров, выставления счетов и безналичной оплаты.</p>
      
      <div className="contact-note" style={{ marginTop: 24 }}>
        <div>
          <div className="eyebrow">Юридические данные</div>
          <h3>Идентификационный номер (ИНН)</h3>
          <p><b>{inn}</b></p>
          <small className="muted">Работаем без НДС (УСН) / возможность работы по договору поставки</small>
        </div>
        <div>
          <div className="eyebrow">Прямая связь</div>
          <h3>Контакты для документов</h3>
          <p>
            <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a>
            <br />
            <a href={`mailto:${email}`}>{email}</a>
            <br />
            <a href={telegram} target="_blank" rel="noreferrer">Telegram: @Gr1shania</a>
          </p>
        </div>
      </div>

      <div className="actions" style={{ marginTop: 32 }}>
        <Link href="/delivery" className="btn secondary">Условия оплаты и доставки</Link>
        <Link href="/3d-pechat-na-zakaz" className="btn accent">Заказать 3D-печать</Link>
      </div>
    </article>
  );
}
