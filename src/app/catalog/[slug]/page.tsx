import { safeJson } from "@/lib/safe-json";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductConfigurator } from "@/components/ProductConfigurator";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_STORE_URL || "https://v2gr1.ru";
  const product = await db.product.findUnique({
    where: { slug },
    include: { images: { orderBy: { position: "asc" } } },
  });

  if (!product) return {};

  const imageUrl = product.images[0]?.url
    ? (product.images[0].url.startsWith("http")
        ? product.images[0].url
        : `${baseUrl}${product.images[0].url}`)
    : undefined;

  return {
    title: `${product.name} — купить 3D-печатное изделие`,
    description: `${product.shortDescription} Материал: ${product.material}. Точное изготовление на 3D-принтере, отправка по всей России.`,
    alternates: {
      canonical: `/catalog/${slug}`,
    },
    openGraph: {
      title: `${product.name} · FORM3D`,
      description: product.shortDescription,
      url: `${baseUrl}/catalog/${slug}`,
      images: imageUrl ? [{ url: imageUrl, alt: product.name }] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_STORE_URL || "https://v2gr1.ru";

  const product = await db.product.findUnique({
    where: { slug },
    include: {
      variants: { where: { active: true }, orderBy: { id: "asc" } },
      category: true,
      images: { orderBy: { position: "asc" } },
    },
  });

  if (!product || !product.active || product.archivedAt) notFound();

  const imageUrl = product.images[0]?.url
    ? (product.images[0].url.startsWith("http")
        ? product.images[0].url
        : `${baseUrl}${product.images[0].url}`)
    : undefined;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.shortDescription,
    sku: product.sku,
    image: imageUrl,
    category: product.category.name,
    brand: {
      "@type": "Brand",
      name: "FORM3D",
    },
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/catalog/${slug}`,
      priceCurrency: "RUB",
      price: (product.priceInKopecks / 100).toFixed(2),
      itemCondition: "https://schema.org/NewCondition",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "FORM3D",
      },
    },
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
      {
        "@type": "ListItem",
        position: 3,
        name: product.category.name,
        item: `${baseUrl}/catalog?category=${product.category.slug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.name,
        item: `${baseUrl}/catalog/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(breadcrumbsSchema) }}
      />
      <ProductConfigurator
        product={{
          name: product.name,
          sku: product.sku,
          shortDescription: product.shortDescription,
          description: product.description,
          category: product.category.name,
          leadTimeDays: product.leadTimeDays,
          modelSourceUrl: product.modelSourceUrl,
          dimensions: product.dimensions,
          weightGrams: product.weightGrams,
          colorSelectable: product.colorSelectable,
          fixedColors: product.fixedColors,
          images: product.images,
          variants: product.variants.map((variant) => ({
            ...variant,
            configuration:
              variant.configuration || variant.size || "Стандартная",
          })),
        }}
      />
    </>
  );
}
