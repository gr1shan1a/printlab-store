import { safeJson } from "@/lib/safe-json";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Контакты мастерской 3D-печати FORM3D — адрес, телефон, Telegram",
  description:
    "Контакты лаборатории 3D-печати FORM3D в Санкт-Петербурге. Телефон: +7 (980) 710-61-71, Telegram @Gr1shania, email form3d-store@yandex.com. Приём 3D-моделей на расчёт и самовывоз.",
  alternates: {
    canonical: "/contacts",
  },
  openGraph: {
    title: "Контакты лаборатории 3D-печати FORM3D",
    description: "Свяжитесь с нами для консультации по материалам или отправьте 3D-модель на онлайн-расчёт.",
    url: "https://v2gr1.ru/contacts",
  },
};

export default function Contacts() {
  const phone = process.env.STORE_PHONE || "+7 980 710-61-71";
  const telegram = process.env.STORE_TELEGRAM || "https://t.me/Gr1shania";
  const email = process.env.STORE_EMAIL || "form3d-store@yandex.com";
  const pickupAddress = process.env.STORE_PICKUP_ADDRESS || "г. Санкт-Петербург, ул. Передовиков 13к1";
  const baseUrl = process.env.NEXT_PUBLIC_STORE_URL || "https://v2gr1.ru";

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "FORM3D — Мастерская 3D-печати",
    image: `${baseUrl}/favicon.ico`,
    telephone: phone,
    email: email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Санкт-Петербург",
      addressRegion: "Ленинградская область",
      streetAddress: pickupAddress,
      addressCountry: "RU",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 55.0968,
      longitude: 36.6122,
    },
    openingHours: "Mo-Su 09:00-21:00",
    url: `${baseUrl}/contacts`,
    sameAs: [telegram],
    priceRange: "₽₽",
  };

  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Главная",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Контакты",
        item: `${baseUrl}/contacts`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(breadcrumbsSchema) }}
      />

      <div className="container section contacts-page">
        {/* Breadcrumb nav */}
        <div className="breadcrumbs-bar">
          <Link href="/">Главная</Link>
          <span>/</span>
          <span className="current">Контакты</span>
        </div>

        <div className="contacts-hero">
          <div>
            <div className="eyebrow">Мастерская на связи каждый день</div>
            <h1>Контакты мастерской 3D-печати FORM3D</h1>
            <p className="lead">
              Консультируем по выбору пластика под условия работы, принимаем файлы STL/STEP на расчёт
              и координируем доставку заказов по всей России.
            </p>
          </div>
          <Link className="btn accent" href="/3d-pechat-na-zakaz">
            Онлайн-расчёт модели →
          </Link>
        </div>

        <div className="contact-channels">
          <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="contact-card">
            <small>Телефон для звонков и WhatsApp</small>
            <b>{phone}</b>
            <span>Консультация инженера (09:00 – 21:00 МСК)</span>
          </a>

          <a href={telegram} target="_blank" rel="noreferrer" className="contact-card">
            <small>Telegram (быстрый ответ)</small>
            <b>Написать в Telegram ↗</b>
            <span>Отправка файлов STL/STEP и фото образцов</span>
          </a>

          <a href={`mailto:${email}`} className="contact-card">
            <small>Официальный Email</small>
            <b>{email}</b>
            <span>Для чертежей, реквизитов и счетов на юрлиц</span>
          </a>
        </div>

        <div className="contact-info-grid">
          <div className="contact-detail-box">
            <div className="eyebrow">Самовывоз и производство</div>
            <h3>Адрес мастерской</h3>
            <p>
              {pickupAddress}
              <br />
              <span className="muted">
                Выдача готовых заказов производится ежедневно по предварительному согласованию.
              </span>
            </p>
            <div className="work-hours-badge">
              <span>Режим работы:</span>
              <b>Ежедневно: 09:00 – 21:00</b>
            </div>
          </div>

          <div className="contact-detail-box">
            <div className="eyebrow">Срочные вопросы</div>
            <h3>Уже оформили заказ?</h3>
            <p>
              Укажите номер заказа в сообщении Telegram или письме на email — мы мгновенно
              подскажем этап производства, статус сушки филамента или трек-номер СДЭК.
            </p>
            <div className="delivery-hint">
              <span>Доставка по РФ:</span>
              <b>СДЭК от 1 дня (до ПВЗ или курьером)</b>
            </div>
          </div>
        </div>

        <div className="contact-legal-note">
          <div>
            <b>Юридические реквизиты:</b>
            <p className="muted">
              Работаем официально как с физическими, так и с юридическими лицами (счёт на оплату, закрывающие документы УПД).
              Подробные реквизиты доступны на странице <Link href="/requisites">Реквизиты и оплата</Link>.
            </p>
          </div>
          <Link href="/delivery" className="btn secondary">
            Условия доставки и оплаты →
          </Link>
        </div>
      </div>
    </>
  );
}
