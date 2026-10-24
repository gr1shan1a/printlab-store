import Link from "next/link";

export function Footer() {
  const phone = process.env.STORE_PHONE || "+7 980 710-61-71";
  const telegram = process.env.STORE_TELEGRAM || "https://t.me/Gr1shania";
  const email = process.env.STORE_EMAIL || "form3d-store@yandex.com";

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link className="logo" href="/">
            FORM<i>3D</i>
          </Link>
          <p className="muted">
            Лаборатория точной 3D-печати деталей, корпусов и малых серий из инженерных пластиков
            PETG, PLA, ABS, TPU и Nylon.
          </p>
          <small className="footer-copy">© {new Date().getFullYear()} FORM3D. Все права защищены.</small>
        </div>

        <div>
          <b>Услуги и каталог</b>
          <p>
            <Link href="/3d-pechat-na-zakaz">3D-печать на заказ</Link>
            <br />
            <Link href="/catalog">Каталог готовых изделий</Link>
            <br />
            <Link href="/3d-pechat-na-zakaz#calculator">Калькулятор стоимости</Link>
            <br />
            <Link href="/#process">Как это работает</Link>
          </p>
        </div>

        <div>
          <b>Контакты</b>
          <p>
            <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a>
            <br />
            <a href={telegram} target="_blank" rel="noreferrer">
              Telegram: @Gr1shania ↗
            </a>
            <br />
            <a href={`mailto:${email}`}>{email}</a>
            <br />
            <span className="muted">Санкт-Петербург / отправка по всей РФ</span>
          </p>
        </div>

        <div>
          <b>Информация</b>
          <p>
            <Link href="/contacts">Контакты и адрес</Link>
            <br />
            <Link href="/delivery">Доставка и оплата</Link>
            <br />
            <Link href="/requisites">Реквизиты</Link>
            <br />
            <Link href="/terms">Условия сервиса</Link>
            <br />
            <Link href="/privacy">Конфиденциальность</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
