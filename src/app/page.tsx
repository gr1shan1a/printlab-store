import Link from "next/link";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/ProductCard";
import { RequestForm } from "@/components/RequestForm";
import { PrintedGallery } from "@/components/PrintedGallery";
import type { Metadata } from "next";
import { HomeVisitTracker } from "@/components/HomeVisitTracker";
import { ScrollValues } from "@/components/ScrollValues";

export const metadata: Metadata = {
  title: "3D-печать на заказ — печать по вашим моделям STL, STEP · FORM3D",
  description: "Онлайн-лаборатория 3D-печати FORM3D. Срочное изготовление деталей, корпусов, креплений и прототипов из PETG, PLA, ABS, TPU и нейлона по вашим файлам STL, STEP, 3MF. Расчёт за 1 минуту, отправка по РФ.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "FORM3D — Срочная 3D-печать деталей по вашей модели",
    description: "Загрузите файл STL, STEP или 3MF — рассчитаем стоимость и запустим в печать. Точность ±0.1 мм, отправка от 24 часов.",
    url: "https://v2gr1.ru",
  }
};
export default async function Home() {
  const [products, categories, gallery] = await Promise.all([
    db.product.findMany({
      where: { active: true, archivedAt: null, featured: true },
      include: { variants: { where: { active: true } }, images: { orderBy: { position: "asc" } } },
      take: 6,
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.galleryItem.findMany({orderBy:{position:"asc"},take:12}),
  ]);
  const galleryItems=gallery.length?gallery.map(item=>({id:item.id,imageUrl:item.imageUrl,caption:item.caption||"Напечатанная работа",reference:item.productUrl||item.caption||"Работа из галереи"})):products.flatMap(product=>product.images[0]?[{id:`product-${product.id}`,imageUrl:product.images[0].url,caption:product.name,reference:`Работа «${product.name}» из галереи`}]:[]);
  return (
    <>
      <HomeVisitTracker />
      <div className="hero-wrap">
        <section className="container hero">
          <div className="hero-copy">
            <div className="eyebrow">Digital craft · физический результат</div>
            <h1>
              3D-печать
              <br />
              на заказ
              <br />
              для ваших задач.
            </h1>
            <p className="lead">
              Функциональные детали, крепления, корпуса и органайзеры. Точная
              3D-печать на заказ из PETG, PLA и ABS — готовые решения, ваша
              3D-модель или изготовление по описанию задачи.
            </p>
            <div className="actions">
              <Link className="btn accent" href="/3d-pechat-na-zakaz">
                Рассчитать печать по модели
              </Link>
              <Link className="btn primary" href="/catalog">
                Каталог готовых изделий
              </Link>
            </div>
          </div>
          <div
            className="hero-stage"
            aria-label="Технологичное изделие, напечатанное послойно"
          >
            <div className="orb" />
            <div className="printed-object" />
            <div className="stage-note">
              Designed digitally
              <br />
              made layer by layer
            </div>
          </div>
        </section>
      </div>
      <ScrollValues />
      <section className="container section">
        <div className="section-head">
          <div>
            <div className="eyebrow">Готово к использованию</div>
            <h2>
              Меньше вещей.
              <br />
              Больше пользы.
            </h2>
          </div>
          <p className="lead">
            Небольшой каталог решений, которые мы печатаем сами и проверяем
            перед отправкой.
          </p>
        </div>
        <div className="categories">
          {categories.map((c) => (
            <Link
              className="category"
              key={c.id}
              href={`/catalog?category=${c.slug}`}
            >
              {c.name}
            </Link>
          ))}
        </div>
        <div className="choice-cards">
          <Link className="choice-card choice-ready" href="/catalog"><span>01</span><b>Выбрать готовое изделие</b><small>Модель, цвет и срок — всё уже понятно.</small><i>→</i></Link>
          <Link className="choice-card choice-custom" href="/3d-pechat-na-zakaz"><span>02</span><b>Напечатать свою модель</b><small>Загрузите STL/STEP файл или чертёж — расчёт за 1 мин.</small><i>→</i></Link>
        </div>
        <div className="grid" style={{ marginTop: 30 }}>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div
          className="actions"
          style={{ justifyContent: "center", marginTop: 42 }}
        >
          <Link className="btn primary" href="/catalog">
            Смотреть весь каталог
          </Link>
        </div>
      </section>
      <section className="dark section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">Материал имеет значение</div>
              <h2>
                Печать без
                <br />
                компромиссов.
              </h2>
            </div>
            <p className="lead">
              Подбираем пластик под условия эксплуатации, а не по принципу «что
              стояло в принтере».
            </p>
          </div>
          <div className="feature-band">
            <div className="feature">
              <strong>±0.2 мм</strong>
              <span>контроль геометрии</span>
            </div>
            <div className="feature">
              <strong>3</strong>
              <span>рабочих материала</span>
            </div>
            <div className="feature">
              <strong>100%</strong>
              <span>проверка изделия</span>
            </div>
            <div className="feature">
              <strong>1–4 дня</strong>
              <span>обычный срок печати</span>
            </div>
          </div>
        </div>
      </section>
      <section id="process" className="section dark">
        <div className="container">
          <div className="eyebrow">От файла до детали</div>
          <h2>Четыре понятных шага.</h2>
          <div className="steps">
            <div className="step">
              <b>01 / ВЫБОР</b>
              <h3>Расскажите задачу</h3>
              <p>Выберите изделие или пришлите ссылку на готовую 3D-модель.</p>
            </div>
            <div className="step">
              <b>02 / ПРОВЕРКА</b>
              <h3>Подберём параметры</h3>
              <p>
                Проверим геометрию, материал, цвет и согласуем точную стоимость.
              </p>
            </div>
            <div className="step">
              <b>03 / ПЕЧАТЬ</b>
              <h3>Создадим послойно</h3>
              <p>Напечатаем, удалим поддержки и проконтролируем размеры.</p>
            </div>
            <div className="step">
              <b>04 / ГОТОВО</b>
              <h3>Передадим вам</h3>
              <p>Надёжно упакуем и отправим либо подготовим к самовывозу.</p>
            </div>
          </div>
        </div>
      </section>
      <PrintedGallery items={galleryItems}/>
      <section id="custom" className="container section">
        <div className="request">
          <div>
            <div className="eyebrow">Custom manufacturing</div>
            <h2>
              Своя идея?
              <br />
              Сделаем.
            </h2>
            <p className="lead">
              Пришлите ссылку на модель — мы только проверим и распечатаем. Нет
              модели? Опишите задачу, и мы предложим решение.
            </p>
          </div>
          <RequestForm />
        </div>
      </section>
    </>
  );
}
