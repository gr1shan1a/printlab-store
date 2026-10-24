import { safeJson } from "@/lib/safe-json";
import type { Metadata } from "next";
import Link from "next/link";
import { PrintOrderCalculator } from "@/components/PrintOrderCalculator";
import { FaqAccordion, FaqItem } from "@/components/FaqAccordion";

export const metadata: Metadata = {
  title: "3D-печать на заказ по моделям и чертежам — расчёт стоимости онлайн",
  description:
    "Срочная 3D-печать деталей на заказ в Санкт-Петербурге и доставка по всех России. FDM и инженерная печать из PETG, PLA, ABS, TPU, Nylon. Загрузка файлов STL, STEP, 3MF, онлайн-калькулятор стоимости от 7 ₽/г, готовность от 24 часов.",
  keywords: [
    "3d печать на заказ",
    "печать на 3d принтере",
    "3д печать деталей",
    "стоимость 3d печати",
    "печать stl файлов",
    "печать по модели",
    "fdm печать деталей",
    "печать petg pla abs",
    "лаборатория 3d печати",
  ],
  alternates: {
    canonical: "/3d-pechat-na-zakaz",
  },
  openGraph: {
    title: "3D-печать на заказ по вашей модели или чертежу · FORM3D",
    description:
      "Загрузите STL или STEP файл — рассчитаем точную стоимость и запустим в печать. Точность ±0.1 мм, отправка от 24ч.",
    url: "https://v2gr1.ru/3d-pechat-na-zakaz",
    type: "website",
  },
};

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "В каком формате присылать 3D-модель для печати?",
    a: "Мы принимаем файлы в форматах STL (.stl), STEP (.step, .stp), 3MF (.3mf) и OBJ (.obj). Формат STEP предпочтителен для инженерных деталей сопряжения, так как сохраняет точные криволинейные поверхности без триангуляции.",
  },
  {
    q: "Сколько стоит 3D-печать и как рассчитывается цена?",
    a: "Базовая стоимость рассчитывается исходя из веса изделия и выбранного материала: от 7 ₽/грамм для PLA, от 8 ₽/грамм для PETG, от 10 ₽/грамм для ABS/ASA и от 14 ₽/грамм для эластичного TPU. Минимальный заказ составляет 350 ₽. При заказе от 5 штук действуют скидки за объем до 25%.",
  },
  {
    q: "Что делать, если у меня нет 3D-модели, а только сломанная деталь или чертёж?",
    a: "Мы выполняем реверс-инжиниринг и 3D-моделирование: вы можете прислать фотографии с линейкой, чертеж с размерами или отправить сломанную оригинальную деталь нам. Инженер разработает точную CAD-модель с учетом усадки и нагрузок.",
  },
  {
    q: "Как быстро изготавливается заказ?",
    a: "Стандартный срок выполнения — 1–2 рабочих дня с момента подтверждения заявки. При небольшом объеме или необходимости срочной печати деталь может быть готова день-в-день (от 4 часов).",
  },
  {
    q: "Какой материал выбрать для детали в автомобиль или на улицу?",
    a: "Для использования в автомобиле (подкапотное пространство, салон на солнце) и на улице мы рекомендуем термостойкий ABS/ASA (выдерживает до 100°C и устойчив к УФ-лучам) либо ударопрочный PETG (до 75°C, высокая стойкость к бензину, маслам и химии). Обычный PLA на солнце может деформироваться.",
  },
  {
    q: "Какая максимальная область печати одной детали?",
    a: "Единая цельная деталь может иметь габариты до 256 × 256 × 256 мм. Если ваше изделие больше, мы разделяем его на составные части с технологическими шип-паз замками или пазами под винты, обеспечивающими монолитную прочность после сборки.",
  },
  {
    q: "Какова точность изготовления деталей?",
    a: "Наши скоростные принтеры Bambu Lab калибруются с точностью до ±0.1–0.2 мм. Для прецизионных резьбовых соединений мы используем вплавляемые латунные резьбовые втулки (M2–M8), что исключает срыв резьбы в пластике.",
  },
  {
    q: "Как организована доставка и оплата?",
    a: "Отправляем заказы курьерской службой СДЭК (до пункта выдачи или курьером в руки), а также Почтой России и Boxberry. В Санкт-Петербурге доступен бесплатный самовывоз. Оплата возможна банковскими картами, через СБП без комиссии или по безналичному расчёту для юрлиц с НДС/без НДС.",
  },
];

export default function CustomPrintingPage() {
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
        name: "3D-печать на заказ",
        item: `${baseUrl}/3d-pechat-na-zakaz`,
      },
    ],
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "3D Printing & Rapid Prototyping",
    name: "3D-печать деталей и изделий на заказ",
    provider: {
      "@type": "ProfessionalService",
      name: "FORM3D",
      url: baseUrl,
      telephone: process.env.STORE_PHONE || "+79807106171",
      email: process.env.STORE_EMAIL || "form3d-store@yandex.com",
    },
    areaServed: {
      "@type": "Country",
      name: "Россия",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Услуги 3D-печати и моделирования",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "FDM 3D-печать из PETG",
            description: "Печать прочных функциональных деталей, креплений и корпусов",
          },
          price: "8.00",
          priceCurrency: "RUB",
          unitCode: "GRM",
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "FDM 3D-печать из PLA",
            description: "Высокоточная печать прототипов и макетов",
          },
          price: "7.00",
          priceCurrency: "RUB",
          unitCode: "GRM",
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "3D-печать из термостойкого ABS / ASA",
            description: "Печать деталей для автомобилей, оборудования и улицы до 100°C",
          },
          price: "10.00",
          priceCurrency: "RUB",
          unitCode: "GRM",
        },
      ],
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
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
        dangerouslySetInnerHTML={{ __html: safeJson(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(faqSchema) }}
      />

      <div className="custom-print-landing">
        {/* Breadcrumb nav */}
        <div className="container breadcrumbs-bar">
          <Link href="/">Главная</Link>
          <span>/</span>
          <span className="current">3D-печать на заказ</span>
        </div>

        {/* Hero Banner */}
        <section className="container custom-hero">
          <div className="custom-hero-copy">
            <div className="badge-pill">Лаборатория 3D-печати · Bambu Lab Precision</div>
            <h1>
              3D-печать на заказ
              <br />
              по вашей модели или чертежу.
            </h1>
            <p className="lead">
              Изготавливаем функциональные детали, кронштейны, корпуса для электроники,
              запчасти для авто и серийные партии. Загрузите файл <b>STL, STEP, 3MF</b> —
              рассчитаем точную стоимость и запустим в печать в течение 24 часов.
            </p>
            <div className="custom-hero-bullets">
              <div className="hero-bullet">
                <span className="bullet-icon">⚡</span>
                <div>
                  <b>Готовность от 24 часов</b>
                  <small>Срочные тиражи день в день</small>
                </div>
              </div>
              <div className="hero-bullet">
                <span className="bullet-icon">🎯</span>
                <div>
                  <b>Точность до ±0.1 мм</b>
                  <small>Контроль геометрии и усадки</small>
                </div>
              </div>
              <div className="hero-bullet">
                <span className="bullet-icon">🛡️</span>
                <div>
                  <b>100% гарантия качества</b>
                  <small>Бесплатный повтор при дефектах</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Order Calculator & File Uploader */}
        <section className="container section calculator-section">
          <div className="section-head center">
            <div className="eyebrow">Интерактивный конфигуратор</div>
            <h2>Рассчитать стоимость и отправить файл</h2>
            <p className="lead">
              Загрузите вашу 3D-модель или укажите параметры детали. Стоимость рассчитывается
              мгновенно с учётом скидок за тираж.
            </p>
          </div>

          <PrintOrderCalculator />
        </section>

        {/* Engineering Plastics Comparison */}
        <section className="dark section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="eyebrow">Материаловедение</div>
                <h2>
                  Инженерные пластики:
                  <br />
                  подберём под условия работы.
                </h2>
              </div>
              <p className="lead">
                Мы используем только сертифицированный пластик первичной грануляции
                с равномерным диаметром прутка 1.75 мм для монолитной спекаемости слоёв.
              </p>
            </div>

            <div className="materials-table-wrap">
              <table className="tech-table">
                <thead>
                  <tr>
                    <th>Материал</th>
                    <th>Рабочая t°</th>
                    <th>Прочность</th>
                    <th>Влагостойкость</th>
                    <th>Назначение и применение</th>
                    <th>Цена за грамм</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <b>PETG</b>
                      <small>Полиэтилентерефталат-гликоль</small>
                    </td>
                    <td>-40°C … +75°C</td>
                    <td><span className="level high">Высокая</span></td>
                    <td>Абсолютная</td>
                    <td>Шестерни, кронштейны, втулки, клипсы, детали бытовой техники</td>
                    <td><strong>от 8 ₽</strong></td>
                  </tr>
                  <tr>
                    <td>
                      <b>PLA</b>
                      <small>Полилиактид (эко-пластик)</small>
                    </td>
                    <td>0°C … +55°C</td>
                    <td><span className="level med">Средняя</span></td>
                    <td>Умеренная</td>
                    <td>Прототипы, макеты, корпуса приборов, элементы интерьера, сувениры</td>
                    <td><strong>от 7 ₽</strong></td>
                  </tr>
                  <tr>
                    <td>
                      <b>ABS / ASA</b>
                      <small>Ударопрочный термопласт</small>
                    </td>
                    <td>-40°C … +100°C</td>
                    <td><span className="level high">Высокая</span></td>
                    <td>Стойкий к УФ и химии</td>
                    <td>Автозапчасти, подкапотный пластик, уличные датчики, ударостойкие корпуса</td>
                    <td><strong>от 10 ₽</strong></td>
                  </tr>
                  <tr>
                    <td>
                      <b>TPU / Flex</b>
                      <small>Термополиуретан эластичный</small>
                    </td>
                    <td>-30°C … +80°C</td>
                    <td><span className="level flex">Эластичный (Shore 95A)</span></td>
                    <td>Маслобензостойкий</td>
                    <td>Прокладки, сальники, демпферы, заглушки, антивибрационные ножки</td>
                    <td><strong>от 14 ₽</strong></td>
                  </tr>
                  <tr>
                    <td>
                      <b>Nylon (PA12 / CF)</b>
                      <small>Полиамид с углеволокном</small>
                    </td>
                    <td>-50°C … +120°C</td>
                    <td><span className="level max">Экстремальная</span></td>
                    <td>Высокая</td>
                    <td>Узлы трения без смазки, ответственные шестерни, промышленные матрицы</td>
                    <td><strong>от 18 ₽</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Pricing Matrix */}
        <section className="container section">
          <div className="section-head center">
            <div className="eyebrow">Прозрачные тарифы</div>
            <h2>Стоимость услуг 3D-печати</h2>
            <p className="lead">
              Никаких скрытых наценок. Цена согласовывается до запуска и остаётся фиксированной.
            </p>
          </div>

          <div className="pricing-cards-grid">
            <div className="price-card">
              <div className="price-card-tier">FDM Печать</div>
              <div className="price-tag">
                от <strong>7 ₽</strong> / грамм
              </div>
              <p className="price-desc">
                Послойное наплавление пластика PETG, PLA, ABS, TPU. Оптимально для функциональных деталей.
              </p>
              <ul className="price-checklist">
                <li>Высота слоя: от 0.12 до 0.28 мм</li>
                <li>Точность геометрии: ±0.15 мм</li>
                <li>Удаление поддержек включено</li>
                <li>Минимальный заказ: 350 ₽</li>
              </ul>
              <a href="#calculator" className="btn accent full-width">Заказать FDM</a>
            </div>

            <div className="price-card popular">
              <div className="popular-badge">Выбор инженеров</div>
              <div className="price-card-tier">Серийное производство</div>
              <div className="price-tag">
                скидки до <strong>-25%</strong>
              </div>
              <p className="price-desc">
                Малые и средние серии от 10 до 500+ деталей. Быстрый запуск партии без затрат на пресс-формы.
              </p>
              <ul className="price-checklist">
                <li>От 5 шт — скидка 7%</li>
                <li>От 10 шт — скидка 15%</li>
                <li>От 25 шт — скидка 25%</li>
                <li>Индивидуальный контроль ОТК</li>
              </ul>
              <a href="#calculator" className="btn primary full-width">Рассчитать партию</a>
            </div>

            <div className="price-card">
              <div className="price-card-tier">3D-моделирование</div>
              <div className="price-tag">
                от <strong>500 ₽</strong> / деталь
              </div>
              <p className="price-desc">
                Создание 3D-модели по чертежу, эскизу или сломанной оригинальной детали.
              </p>
              <ul className="price-checklist">
                <li>Реверс-инжиниринг деталей</li>
                <li>Подготовка файлов к 3D-печати</li>
                <li>Передача исходников STEP / STL</li>
                <li>Коррекция посадочных мест</li>
              </ul>
              <a href="#calculator" className="btn secondary full-width">Заказать модель</a>
            </div>
          </div>
        </section>

        {/* Technical Requirements */}
        <section className="dark section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="eyebrow">Технические требования</div>
                <h2>Как подготовить файл к печати</h2>
              </div>
              <p className="lead">
                Соблюдение простых правил гарантирует идеальную сборку и прочность изделия.
              </p>
            </div>

            <div className="tech-requirements-grid">
              <div className="tech-card">
                <div className="tech-num">01</div>
                <h3>Форматы файлов</h3>
                <p>
                  Идеальный формат — <b>STEP (.step, .stp)</b> или <b>STL (.stl)</b> с плотной сеткой.
                  Также поддерживаются архивы 3MF и OBJ. Единицы измерения — миллиметры (1:1).
                </p>
              </div>

              <div className="tech-card">
                <div className="tech-num">02</div>
                <h3>Толщина стенок</h3>
                <p>
                  Минимальная рекомендуемая толщина стенки — <b>0.8–1.2 мм</b> (не менее 2–3 периметров сопла 0.4 мм).
                  Для нагруженных узлов закладывайте толщину от 2.4 мм.
                </p>
              </div>

              <div className="tech-card">
                <div className="tech-num">03</div>
                <h3>Зазоры и допуски</h3>
                <p>
                  Для подвижных сопряжений (оси, петли, крышки) закладывайте технологический зазор
                  <b>0.2–0.3 мм</b>. Для плотной запрессовки подшипников зазор 0.05–0.1 мм.
                </p>
              </div>

              <div className="tech-card">
                <div className="tech-num">04</div>
                <h3>Резьбовые соединения</h3>
                <p>
                  Вместо нарезки мелкой резьбы в пластике мы рекомендуем отверстия под вплавляемые
                  латунные резьбовые втулки <b>M3, M4, M5</b>. Это выдерживает сотни циклов закручивания.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Process Steps */}
        <section className="container section">
          <div className="section-head center">
            <div className="eyebrow">Быстрый цикл</div>
            <h2>4 простых шага от заявки до получения</h2>
          </div>

          <div className="steps">
            <div className="step">
              <b>01 / ФАЙЛ</b>
              <h3>Загрузите модель</h3>
              <p>Прикрепите STL/STEP файл или опишите задачу через калькулятор.</p>
            </div>
            <div className="step">
              <b>02 / ПРОВЕРКА</b>
              <h3>Проверка инженером</h3>
              <p>Проверим слайсинг, выберем пластик и подтвердим точную цену.</p>
            </div>
            <div className="step">
              <b>03 / ПЕЧАТЬ</b>
              <h3>Печать на Bambu Lab</h3>
              <p>Послойное изготовление с контролем качества и обработкой поддержек.</p>
            </div>
            <div className="step">
              <b>04 / ДОСТАВКА</b>
              <h3>Отправка СДЭК</h3>
              <p>Бережная упаковка в пупырчатую плёнку и отправка в любой город РФ.</p>
            </div>
          </div>
        </section>

        {/* FAQ with Schema.org Accordion */}
        <section className="container section faq-section">
          <div className="section-head center">
            <div className="eyebrow">Частые вопросы</div>
            <h2>Ответы на вопросы о 3D-печати</h2>
            <p className="lead">
              Всё, что нужно знать о материалах, сроках, оплате и требованиях к моделям.
            </p>
          </div>

          <FaqAccordion items={FAQ_ITEMS} />
        </section>

        {/* Final CTA Strip */}
        <section className="dark section">
          <div className="container custom-cta-strip">
            <div>
              <h2>Готовы запустить деталь в печать?</h2>
              <p className="lead">
                Отправьте файл сейчас — инженер свяжется с вами для согласования деталей в течение 15 минут.
              </p>
            </div>
            <a href="#calculator" className="btn accent">
              Перейти к расчёту и загрузке файла →
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
