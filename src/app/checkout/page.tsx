import { currentUser } from "@/lib/auth";
import { CheckoutForm } from "@/components/CheckoutForm";

export default async function Checkout() {
  const user = await currentUser();
  return <div className="container checkout-page">
    <section className="checkout-intro">
      <div className="eyebrow">Оформление заказа</div>
      <h1>Оформление<br />заказа</h1>
      <p>Заказ можно оформить без регистрации. Укажите контакты, выберите доставку и оплатите через ЮKassa.</p>
      <ol className="checkout-steps">
        <li className="is-current"><span>01</span><div><b>Получение</b><small>Адрес и контакты</small></div></li>
        <li><span>02</span><div><b>Оплата</b><small>Защищённая страница ЮKassa</small></div></li>
        <li><span>03</span><div><b>Изготовление</b><small>Приступим после оплаты</small></div></li>
      </ol>
      <div className="checkout-note"><b>В работу — только после оплаты</b><span>Приступим к изготовлению, когда ЮKassa подтвердит платёж.</span></div>
    </section>
    <section className="checkout-panel">
      <div className="checkout-panel-head"><div><div className="eyebrow">Оформление</div><h2>Ваш заказ</h2></div>{user && <span>Заказ привяжется к аккаунту</span>}</div>
      <CheckoutForm email={user?.email || ""} name={user?.name || ""} pickupAddress={process.env.STORE_PICKUP_ADDRESS || "Адрес самовывоза уточняется после подтверждения"} />
    </section>
  </div>;
}
