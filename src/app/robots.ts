import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_STORE_URL || "https://v2gr1.ru";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/account",
          "/account/*",
          "/checkout",
          "/checkout/*",
          "/cart",
          "/login",
          "/register",
          "/order/*",
          "/api/*",
          "/*?*search=",
        ],
      },
      {
        userAgent: "YandexBot",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/account",
          "/account/*",
          "/checkout",
          "/checkout/*",
          "/cart",
          "/login",
          "/register",
          "/order/*",
          "/api/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl.replace(/^https?:\/\//, ""),
  };
}
