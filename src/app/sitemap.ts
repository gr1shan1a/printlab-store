import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_STORE_URL || "https://v2gr1.ru";

  const products = await db.product.findMany({
    where: { active: true, archivedAt: null },
    select: { slug: true, updatedAt: true },
  });

  const staticRoutes: {
    url: string;
    lastModified: Date;
    changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
    priority: number;
  }[] = [
    {
      url: `${base}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${base}/3d-pechat-na-zakaz`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${base}/catalog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/contacts`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/delivery`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/requisites`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${base}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  const productRoutes = products.map((p) => ({
    url: `${base}/catalog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  return [...staticRoutes, ...productRoutes];
}
