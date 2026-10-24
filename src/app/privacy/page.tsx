import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Политика конфиденциальности · FORM3D",
  description: "Политика конфиденциальности и обработки персональных данных клиентов FORM3D.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function Privacy() {
  return (
    <article className="container section">
      <div className="breadcrumbs-bar">
        <Link href="/">Главная</Link>
        <span>/</span>
        <span className="current">Конфиденциальность</span>
      </div>
      <h2>Политика конфиденциальности</h2>
      <p className="lead">
        Контактные данные (имя, номер телефона, email, адрес доставки и 3D-модели) используются исключительно для
        расчёта стоимости, изготовления заказа и связи с клиентом.
      </p>
      <p>
        Мы не передаём личные данные третьим лицам, за исключением курьерских служб (СДЭК) для выполнения доставки.
        Все загруженные 3D-модели клиентов являются их интеллектуальной собственностью и не публикуются без письменного согласия.
      </p>
    </article>
  );
}
