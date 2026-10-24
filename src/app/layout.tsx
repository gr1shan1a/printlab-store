import { safeJson } from "@/lib/safe-json";
import type {Metadata,Viewport} from "next";import "./globals.css";import {Header} from "@/components/Header";import {Footer} from "@/components/Footer";import {SessionKeeper} from "@/components/SessionKeeper";
export const dynamic="force-dynamic";
export const metadata:Metadata={
  title:{default:"3D-печать на заказ и готовые изделия — FORM3D",template:"%s · FORM3D"},
  description:"3D-печать на заказ в Санкт-Петербурге и по всей России. Точное изготовление деталей, корпусов, креплений и малых серий из PETG, PLA, ABS, TPU и нейлона по моделям STL, STEP, 3MF.",
  keywords:["3D печать на заказ","3д печать на заказ","печать на 3D принтере","3D печать деталей","изготовление деталей на 3D принтере","печать stl файлов","печать step файлов","онлайн заказ 3d печати"],
  metadataBase:new URL(process.env.NEXT_PUBLIC_STORE_URL||"https://v2gr1.ru"),
  icons:{icon:[{url:"/favicon.ico",type:"image/x-icon",sizes:"48x48"},{url:"/favicon-48.png",type:"image/png",sizes:"48x48"}],shortcut:"/favicon.ico"},
  openGraph:{type:"website",locale:"ru_RU",siteName:"FORM3D",title:"3D-печать на заказ и готовые изделия — FORM3D",description:"Детали, корпуса и изделия из PETG, PLA, ABS, TPU и нейлона — по вашей 3D-модели или задаче с доставкой по РФ."},
  verification:{
    google:"5721eee4c5a04791",
  }
};
export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:[{media:"(prefers-color-scheme: light)",color:"#ffffff"},{media:"(prefers-color-scheme: dark)",color:"#090a09"}]};

export default function Layout({children}:{children:React.ReactNode}){
  const baseUrl = process.env.NEXT_PUBLIC_STORE_URL || "https://v2gr1.ru";
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "FORM3D — Лаборатория и студия 3D-печати",
    "alternateName": ["FORM3D", "PrintLab Store"],
    "url": baseUrl,
    "logo": `${baseUrl}/favicon.ico`,
    "image": `${baseUrl}/favicon.ico`,
    "description": "Срочная и точная 3D-печать функциональных деталей, корпусов и малых серий по моделям STL, STEP, OBJ, 3MF из PETG, PLA, ABS, TPU и Nylon.",
    "telephone": process.env.STORE_PHONE || "+79807106171",
    "email": process.env.STORE_EMAIL || "form3d-store@yandex.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Санкт-Петербург",
      "addressRegion": "Ленинградская область",
      "addressCountry": "RU"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 55.0968,
      "longitude": 36.6122
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "09:00",
        "closes": "21:00"
      }
    ],
    "priceRange": "₽₽",
    "currenciesAccepted": "RUB",
    "paymentAccepted": "Безналичный расчёт, СБП, банковские карты, наличные",
    "areaServed": {
      "@type": "Country",
      "name": "Россия"
    },
    "sameAs": [
      process.env.STORE_TELEGRAM || "https://t.me/Gr1shania"
    ]
  };

  return (
    <html lang="ru">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJson(orgSchema) }}
        />
      </head>
      <body>
        <SessionKeeper/>
        <Header/>
        <main>{children}</main>
        <Footer/>
      </body>
    </html>
  );
}
