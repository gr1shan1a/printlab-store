import { safeJson } from "@/lib/safe-json";
import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion, FaqItem } from "@/components/FaqAccordion";

export const metadata: Metadata = {
  title: "Доставка и оплата 3D-печати — СДЭК, курьер, самовывоз",
  description:
    "Условия доставки и оплаты готовых 3D-печатных деталей FORM3D — доставка СДЭК по РФ, надёжная амортизирующая упаковка и 100% гарантия сохранности. Доставка до пункта выдачи (ПВЗ) обычно составляет 250–390 ₽, курьерская доставка до двери — от 450 ₽. Доставка по России и всей России. Отправка СДЭК оти всей России. Отправка СДЭК от 1 дня, оплата онлайн картами, через СБП или по счёту для юридических лиц.",
  alternates: {
    canonical: "/delivery",
  },
  openGraph: {
    title: "Доставка и оплата 3D-печати деталей · FORM3D",
    description: "Быстрая доставка заказов СДЭК по РФ, надёжная амортизирующая упаковка и 100% гарантия сохранности.",
    url: "https://v2gr1.ru/delivery",
  },
};

const DELIVERY_FAQS: FaqItem[] = [
  {
    q: "Как быстро отправляется напечатанный заказ?",
    a: "После завершения 3D-печати и обязательного контроля геометрии деталь упаковывается и передаётся в службу доставки в течение 24 часов. Трек-номер для отслеживания отправляется на ваш email и в Telegram.",
  },
  {
    q: "Сколько стоит доставка СДЭК?",
    a: "Стоимость доставки рассчитывается по тарифам СДЭК в зависимости от города: доставка до пункта выдачи (ПВЗ) обычно составляет 250–390 ₽, курьерская доставка до двери — от 450 ₽. При оформлении заказа в корзине сумма рассчитывается автоматически.",
  },
  {
    q: "Как упаковываются хрупкие детали?",
    a: "Каждое изделие оборачивается в многослойную воздушно-пузырьковую плёнку, фиксируется наполнителем и упаковывается в плотную картонную коробку. Внутрь вкладывается влагопоглощающий силикагель.",
  },
  {
    q: "Могут ли юридические лица оплатить по счёту?",
    a: "Да, мы работаем с юридическими лицами и ИП по безналичному расчёту. Выставляем официальный счёт на оплату и предоставляем полный комплект закрывающих документов (УПД) через ЭДО или оригиналы с доставкой.",
  },
  {
    q: "Что делать, если деталь повредилась при транспортировке?",
    a: "Мы несём 100% ответственность за сохранность груза. Если транспортная компания повредила упаковку или деталь — пришлите фото в день получения, и мы бесплатно перепечатаем и отправим ваш заказ за наш счёт.",
  },
];

export default function Delivery() {
  const baseUrl = process.env.NEXT_PUBLIC_STORE_URL || "https://v2gr1.ru";

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
        name: "Доставка и оплата",
        item: `${baseUrl}/delivery`,
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: DELIVERY_FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(breadcrumbsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(faqSchema) }}
      />

      <div className="container section delivery-page">
        {/* Breadcrumb nav */}
        <div className="breadcrumbs-bar">
          <Link href="/">Главная</Link>
          <span>/</span>
          <span className="current">Доставка и оплата</span>
        </div>

        <div className="delivery-hero">
          <div className="eyebrow">Условия сервиса</div>
          <h1>Доставка и оплата 3D-печати</h1>
          <p className="lead">
            Отправляем напечатанные детали по всей России. Надёжно упаковываем, предоставляем трек-номер
            и несём полную гарантию сохранности каждого изделия.
          </p>
        </div>

        {/* Delivery Options */}
        <section className="delivery-methods-section">
          <h2>Способы доставки</h2>
          <div className="delivery-cards-grid">
            <div className="delivery-card">
              <div className="deliv-icon">🚚</div>
              <h3>СДЭК — Пункт выдачи (ПВЗ)</h3>
              <div className="deliv-meta">Срок: от 1–3 дней · от 290 ₽</div>
              <p>
                Более 4 000 пунктов выдачи заказов по всей России. Удобно забрать рядом с домом
                или работой в любое время работы отделения.
              </p>
            </div>

            <div className="delivery-card">
              <div className="deliv-icon">🚪</div>
              <h3>СДЭК — Курьер до двери</h3>
              <div className="deliv-meta">Срок: от 1–2 дней · от 450 ₽</div>
              <p>
                Курьер привезёт заказ прямо на дом или на производство. Предварительный звонок
                за 30–60 минут до прибытия.
              </p>
            </div>

            <div className="delivery-card">
              <div className="deliv-icon">🏪</div>
              <h3>Бесплатный самовывоз</h3>
              <div className="deliv-meta">Срок: день готовности · 0 ₽</div>
              <p>
                Самовывоз из мастерской в Санкт-Петербурге по предварительному согласованию времени.
                Возможность проверить деталь на месте.
              </p>
            </div>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="payment-methods-section">
          <h2>Способы оплаты</h2>
          <div className="payment-cards-grid">
            <div className="payment-card">
              <div className="pay-badge">Физическим лицам</div>
              <h3>Банковские карты онлайн</h3>
              <p>
                Оплата картами МИР, Visa, MasterCard через защищённый шлюз ЮKassa.
                Мгновенное зачисление без дополнительных комиссий.
              </p>
            </div>

            <div className="payment-card">
              <div className="pay-badge">Удобно и быстро</div>
              <h3>СБП (Система быстрых платежей)</h3>
              <p>
                Оплата по QR-коду через мобильное приложение любого российского банка.
                Без комиссии и без необходимости вводить данные карты.
              </p>
            </div>

            <div className="payment-card">
              <div className="pay-badge">Юридическим лицам</div>
              <h3>Безналичный расчёт для юрлиц</h3>
              <p>
                Выставление счёта на оплату для компаний и ИП. Полный пакет закрывающих документов
                (УПД) по ЭДО Диадок / СБИС или на бумаге.
              </p>
            </div>
          </div>
        </section>

        {/* Packaging & Quality Assurance */}
        <section className="delivery-packaging-section">
          <div className="packaging-box">
            <div>
              <div className="eyebrow">Стандарты упаковки</div>
              <h2>Безопасность каждой детали</h2>
              <p className="lead">
                Мы знаем, как важно получить точные детали без сколов и деформаций. Поэтому используем
                индивидуальную воздушно-пузырьковую плёнку, плотный пятислойный гофрокартон и амортизирующий наполнитель.
              </p>
              <ul className="packaging-list">
                <li>✓ Индивидуальная упаковка мелких компонентов</li>
                <li>✓ Силикагель в каждой посылке для защиты от влажности</li>
                <li>✓ Маркировка «Хрупкий груз» для бережной сортировки</li>
                <li>✓ Страхование каждого отправления на полную стоимость</li>
              </ul>
            </div>
            <div className="guarantee-badge-box">
              <div className="big-icon">🛡️</div>
              <h3>100% Гарантия качества</h3>
              <p>
                Если изделие повреждено при транспортировке или выявлен скрытый дефект печати —
                мы бесплатно изготовим деталь заново и отправим за наш счёт.
              </p>
            </div>
          </div>
        </section>

        {/* Delivery FAQ */}
        <section className="delivery-faq-section">
          <div className="section-head center">
            <div className="eyebrow">Вопросы о доставке</div>
            <h2>Часто задаваемые вопросы</h2>
          </div>
          <FaqAccordion items={DELIVERY_FAQS} />
        </section>

        <div className="delivery-bottom-cta">
          <div>
            <h3>Нужен точный расчёт стоимости печати и доставки?</h3>
            <p className="muted">Загрузите модель в онлайн-калькулятор или свяжитесь с инженером мастерской.</p>
          </div>
          <div className="actions">
            <Link href="/3d-pechat-na-zakaz" className="btn accent">
              Калькулятор 3D-печати →
            </Link>
            <Link href="/contacts" className="btn primary">
              Связаться с нами
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
