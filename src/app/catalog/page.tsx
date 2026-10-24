import { safeJson } from "@/lib/safe-json";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/ProductCard";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Каталог изделий 3D-печати — купить готовые модели и аксессуары · FORM3D",
  description:
    "Каталог готовых 3D-печатных изделий: настольные календари, держатели, органайзеры, док-станции и аксессуары из качественного PETG и PLA. Доставка по всей России.",
  alternates: { canonical: "/catalog" },
  openGraph: {
    title: "Каталог готовых 3D-печатных изделий · FORM3D",
    description: "Функциональные изделия и аксессуары для дома и рабочего места, напечатанные на высокоточных 3D-принтерах.",
    url: "https://v2gr1.ru/catalog",
  },
};

export default async function Catalog({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const q = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_STORE_URL || "https://v2gr1.ru";

  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const products = await db.product.findMany({
    where: {
      active: true,
      archivedAt: null,
      AND: q.category
        ? [
            {
              OR: [
                { category: { slug: q.category } },
                { categories: { some: { slug: q.category } } },
              ],
            },
          ]
        : undefined,
      OR: q.search
        ? [
            { name: { contains: q.search, mode: "insensitive" } },
            { description: { contains: q.search, mode: "insensitive" } },
            { sku: { contains: q.search, mode: "insensitive" } },
          ]
        : undefined,
    },
    include: {
      variants: { where: { active: true } },
      images: { orderBy: { position: "asc" } },
    },
    orderBy:
      q.sort === "price_asc"
        ? { priceInKopecks: "asc" }
        : q.sort === "price_desc"
          ? { priceInKopecks: "desc" }
          : { createdAt: "desc" },
  });

  const buildHref = (category: string) => {
    const params = new URLSearchParams();
    if (q.search) params.set("search", q.search);
    if (category) params.set("category", category);
    if (q.sort && q.sort !== "new") params.set("sort", q.sort);
    const value = params.toString();
    return `/catalog${value ? `?${value}` : ""}`;
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
        name: "Каталог",
        item: `${baseUrl}/catalog`,
      },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Каталог изделий FORM3D",
    itemListElement: products.map((p, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "Product",
        name: p.name,
        description: p.shortDescription,
        url: `${baseUrl}/catalog/${p.slug}`,
        image: p.images[0]?.url ? (p.images[0].url.startsWith("http") ? p.images[0].url : `${baseUrl}${p.images[0].url}`) : undefined,
        offers: {
          "@type": "Offer",
          price: (p.priceInKopecks / 100).toFixed(2),
          priceCurrency: "RUB",
          availability: "https://schema.org/InStock",
        },
      },
    })),
  };

  const currentCategory = q.category
    ? categories.find((c) => c.slug === q.category)
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(breadcrumbsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(itemListSchema) }}
      />

      <div className="container catalog-page">
        {/* Breadcrumb nav */}
        <div className="breadcrumbs-bar">
          <Link href="/">Главная</Link>
          <span>/</span>
          <span className="current">Каталог</span>
          {currentCategory && (
            <>
              <span>/</span>
              <span className="current">{currentCategory.name}</span>
            </>
          )}
        </div>

        <header className="catalog-hero">
          <div>
            <div className="eyebrow">Фирменная линейка изделий</div>
            <h1>Каталог 3D-печатных изделий</h1>
            <p className="lead">
              Функциональные вещи для дома, рабочего места, авто и техники. Каждая модель
              спроектирована с учётом физики 3D-печати и протестирована перед продажей.
            </p>
          </div>
          <span>
            <b>{products.length}</b> {products.length === 1 ? "модель" : products.length < 5 ? "модели" : "моделей"}
          </span>
        </header>

        {/* Custom Print Promo Banner */}
        <div className="catalog-custom-banner">
          <div className="banner-copy">
            <span className="banner-badge">Услуга 3D-печати на заказ</span>
            <h3>Не нашли нужную деталь или хотите напечатать свой файл?</h3>
            <p>
              Загрузите файл <b>STL, STEP или 3MF</b> в онлайн-калькулятор. Рассчитаем стоимость
              печати из PETG, PLA или ABS от 7 ₽/грамм и изготовим от 24 часов.
            </p>
          </div>
          <Link href="/3d-pechat-na-zakaz" className="btn accent">
            Рассчитать печать по своей модели →
          </Link>
        </div>

        <div className="catalog-category-strip">
          <a className={!q.category ? "active" : ""} href={buildHref("")}>
            Все изделия
          </a>
          {categories.map((category) => (
            <a
              className={q.category === category.slug ? "active" : ""}
              key={category.id}
              href={buildHref(category.slug)}
            >
              {category.name}
            </a>
          ))}
        </div>

        <details className="catalog-filter-panel" open>
          <summary>
            <span>Поиск и параметры</span>
            <b>{q.search || q.category ? "Применены" : "Фильтры"}</b>
          </summary>
          <form className="catalog-toolbar">
            <div className="field">
              <label>Поиск по названию или артикулу</label>
              <input
                name="search"
                type="search"
                placeholder="Подставка, органайзер, держатель…"
                defaultValue={q.search}
              />
            </div>
            <div className="field">
              <label>Категория</label>
              <select name="category" defaultValue={q.category || ""}>
                <option value="">Все категории</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Сортировка</label>
              <select name="sort" defaultValue={q.sort || "new"}>
                <option value="new">Сначала новые</option>
                <option value="price_asc">По возрастанию цены (↑)</option>
                <option value="price_desc">По убыванию цены (↓)</option>
              </select>
            </div>
            <button className="btn primary">Найти</button>
            {(q.search || q.category || q.sort) && (
              <a className="catalog-reset" href="/catalog">
                Сбросить
              </a>
            )}
          </form>
        </details>

        <div className="catalog-result-head">
          <b>{currentCategory ? currentCategory.name : "Все изделия"}</b>
          <span>{products.length} найдено</span>
        </div>

        <div className="catalog-layout">
          {products.length ? (
            <div className="catalog-grid">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <h3>По вашему запросу ничего не найдено</h3>
              <p className="muted">
                Вы можете сбросить фильтры или отправить файл модели для индивидуальной печати.
              </p>
              <div className="actions" style={{ marginTop: 20 }}>
                <a className="btn secondary" href="/catalog">
                  Сбросить поиск
                </a>
                <Link className="btn accent" href="/3d-pechat-na-zakaz">
                  Заказать индивидуальную печать
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
