"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CartItem, readCart, writeCart } from "@/lib/cart-client";
import { PhoneInput } from "@/components/PhoneInput";
import { CdekOfficePicker } from "@/components/CdekOfficePicker";
import { CaptchaField } from "@/components/CaptchaField";
import { money } from "@/lib/money";

export function CheckoutForm({ email = "", name = "", pickupAddress }: { email?: string; name?: string; pickupAddress: string }) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]), [error, setError] = useState(""), [comment, setComment] = useState("");
  const [phone, setPhone] = useState("+7"), [deliveryEstimate, setDeliveryEstimate] = useState<number | null>(null);
  const [delivery, setDelivery] = useState<"pickup" | "delivery">("delivery"), [recipientReady, setRecipientReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false), [captchaReset, setCaptchaReset] = useState(0);
  useEffect(() => setCart(readCart()), []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setIsSubmitting(true);
    const form = e.currentTarget, data = Object.fromEntries(new FormData(form));
    const requestBody = JSON.stringify({ ...data, items: cart.map(({ variantId, quantity }) => ({ variantId, quantity })) });
    try {
      if (new TextEncoder().encode(requestBody).byteLength > 64 * 1024) { setError("Данные заказа слишком большие. Сократите комментарий и попробуйте ещё раз."); return; }
      const response = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: requestBody });
      const body = await response.json().catch(() => null);
      if (!response.ok) { setError(body?.error || "Не удалось оформить заказ. Проверьте данные и попробуйте ещё раз."); setCaptchaReset(value => value + 1); return; }
      if (!body) { setError("Сервер вернул некорректный ответ. Заказ не оформлен, попробуйте ещё раз."); return; }
      writeCart([]);
      if (body.paymentUrl) window.location.assign(body.paymentUrl); else router.push(`/order/${body.id}`);
    } catch { setError("Не удалось связаться с сервером. Попробуйте ещё раз."); }
    finally { setIsSubmitting(false); }
  }
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.priceInKopecks * item.quantity, 0);
  return <form className="form checkout-form" onSubmit={submit}>
    <div className="checkout-cart-summary" aria-live="polite"><div><span>Ваш заказ</span><b>{itemCount ? `${itemCount} шт.` : "Корзина пуста"}</b></div><div><span>Товары</span><b>{money(subtotal)}</b></div>{delivery === "delivery" && <div><span>Доставка СДЭК</span><b>{deliveryEstimate === null ? "После выбора ПВЗ" : money(deliveryEstimate)}</b></div>}<div><span>Итого</span><strong>{money(subtotal + (delivery === "delivery" ? deliveryEstimate || 0 : 0))}</strong></div><small>Доставка добавится к заказу и будет оплачена вместе с товарами.</small></div>
    <section className="checkout-section"><div className="checkout-section-heading"><span>01</span><div><h3>Контактные данные</h3><p>На этот email придут подтверждение оплаты и информация о заказе.</p></div></div>
      <div className="field"><label>Ваше имя <i className="required-mark">*</i></label><input name="customerName" defaultValue={name} required minLength={2} maxLength={100} autoComplete="name" placeholder="Как к вам обращаться"/></div>
      <div className="field"><label>Email <i className="required-mark">*</i></label><input name="email" type="email" defaultValue={email} required maxLength={160} autoComplete="email" placeholder="name@example.ru"/></div>
      <div className="field"><label>Телефон <i className="required-mark">*</i></label><PhoneInput value={phone} onChange={setPhone} required/></div>
      <label className="checkout-consent"><input name="consent" type="checkbox" value="true" required/><span>Я даю согласие на обработку персональных данных в соответствии с <a href="https://greenplastik.ru/privacy" target="_blank" rel="noreferrer">политикой конфиденциальности</a>.</span></label>
    </section>
    <section className="checkout-section"><div className="checkout-section-heading"><span>02</span><div><h3>Доставка</h3><p>Выберите получение в пункте выдачи или самовывоз.</p></div></div>
      <div className="checkout-choice"><button type="button" className={delivery === "delivery" ? "active" : ""} onClick={() => { setDelivery("delivery"); setRecipientReady(false); setDeliveryEstimate(null); }}><b>Пункт выдачи СДЭК</b><span>Покажем доступные пункты на карте</span></button><button type="button" className={delivery === "pickup" ? "active" : ""} onClick={() => { setDelivery("pickup"); setRecipientReady(true); setDeliveryEstimate(null); }}><b>Самовывоз</b><span>Бесплатно</span></button></div>
      <input type="hidden" name="deliveryMethod" value={delivery}/><input type="hidden" name="paymentMethod" value="after_confirmation"/>
      {delivery === "delivery" ? <CdekOfficePicker items={cart} onCostChange={setDeliveryEstimate} onSelectedChange={setRecipientReady}/> : <><input type="hidden" name="city" value="Санкт-Петербург"/><input type="hidden" name="address" value={pickupAddress}/><div className="pickup-box"><b>Адрес самовывоза</b><span>{pickupAddress}</span><small>Сообщим, когда заказ будет готов.</small></div></>}
    </section>
    {recipientReady && <section className="checkout-section"><div className="checkout-section-heading"><span>03</span><div><h3>Получатель и комментарий</h3><p>Укажите ФИО так, как оно указано в документе.</p></div></div>
      <div className="field"><label>ФИО получателя полностью <i className="required-mark">*</i></label><input name="recipientName" required minLength={5} maxLength={160} autoComplete="name" placeholder="Иванов Иван Иванович"/></div>
      <div className="field"><label>Комментарий к заказу</label><textarea name="comment" maxLength={1000} value={comment} onChange={event => setComment(event.target.value.slice(0, 1000))} placeholder="Пожелания к заказу или доставке…"/><small className="checkout-comment-hint">{comment.length}/1000 символов</small></div>
    </section>}
    <CaptchaField resetKey={captchaReset}/>
    {error && <div className="notice error">{error}</div>}
    <button className="btn accent checkout-submit" disabled={!cart.length || isSubmitting || !recipientReady}>{isSubmitting ? "Готовим оплату…" : "Оплатить заказ"}{!isSubmitting && <span>→</span>}</button>
  </form>;
}
