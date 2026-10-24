import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { orderCreatedAt, paymentStatusLabel } from "@/lib/order-display";
import { money } from "@/lib/money";
import { statusLabel } from "@/lib/status";
import { syncYooKassaOrder } from "@/lib/payment-status";
import { PaymentStatusWatcher } from "@/components/PaymentStatusWatcher";
import { isValidGuestOrderToken } from "@/lib/guest-order";

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ payment?: string; access?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await currentUser();
  const guestAccess = isValidGuestOrderToken(id, query.access);
  if (!user && !guestAccess) redirect("/login");
  const where = { id, ...(user ? (user.role === "ADMIN" ? {} : { userId: user.id }) : { userId: null }) };
  const existing = await db.order.findFirst({ where, select: { id: true } });
  if (!existing) notFound();
  try { await syncYooKassaOrder(existing.id); } catch (error) { console.error("YooKassa status sync failed", error); }
  const order = await db.order.findFirst({ where, include: { items: true, history: { orderBy: { createdAt: "asc" } } } });
  if (!order) notFound();
  const awaitingPayment = order.status !== "CANCELLED" && order.paymentStatus === "PENDING" && Boolean(order.paymentId);
  const merchandiseTotal = order.items.reduce((sum, item) => sum + item.priceInKopecks * item.quantity, 0);
  const legacyShippingIncluded = order.deliveryCostInKopecks > 0 && order.totalInKopecks > merchandiseTotal;
  const paymentRetrySafe = Boolean(order.paymentId) || Date.now() - order.createdAt.getTime() <= 23 * 60 * 60 * 1000;
  return <div className="container section"><div className="eyebrow">Заказ оформлен</div><h2>Заказ #{order.number}</h2><p>Создан: <time dateTime={order.createdAt.toISOString()}>{orderCreatedAt(order.createdAt)}</time></p><p>Оплата: <b>{paymentStatusLabel[order.paymentStatus]}</b></p><p className="notice">Текущий статус: {statusLabel[order.status]}</p>{order.paymentStatus === "PAID" ? <p className="notice">Оплата получена.</p> : order.paymentStatus === "CANCELED" || order.status === "CANCELLED" ? <p className="notice error">Заказ отменён, оплатить его нельзя.</p> : <p className="notice">Ожидаем оплату заказа через ЮKassa.</p>}
{order.cdekTrackingNumber && (
  <div className="notice" style={{ background: "#f2f8eb", borderColor: "#9bcc4d", marginTop: 12, marginBottom: 12 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <b>🚚 Доставка СДЭК:</b>
      <span>трек-номер <b>{order.cdekTrackingNumber}</b></span>
      {order.cdekStatus && <span className="muted">({order.cdekStatus})</span>}
    </div>
    <div style={{ marginTop: 8 }}>
      <a
        href={`https://www.cdek.ru/ru/tracking?order_id=${encodeURIComponent(order.cdekTrackingNumber)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn secondary"
        style={{ padding: "6px 12px", fontSize: 13, textDecoration: "none", display: "inline-block" }}
      >
        Отследить посылку на сайте СДЭК →
      </a>
    </div>
  </div>
)}{query.payment === "retry-expired" && <p className="notice error">Не удалось безопасно восстановить платёж. Чтобы избежать повторного списания, свяжитесь с нами перед повторной оплатой.</p>}{awaitingPayment && <PaymentStatusWatcher />}<table><tbody>{order.items.map(x => <tr key={x.id}><td><b>{x.productName}</b><br /><span className="muted">{x.variantLabel}</span></td><td>{x.quantity} шт.</td><td>{money(x.priceInKopecks * x.quantity)}</td></tr>)}{legacyShippingIncluded ? <><tr><td>Доставка СДЭК · включена в оплату заказа</td><td /><td>{money(order.deliveryCostInKopecks)}</td></tr><tr><td /><td><b>Итого к оплате онлайн</b></td><td><b>{money(order.totalInKopecks)}</b></td></tr></> : <><tr><td /><td><b>К оплате онлайн</b></td><td><b>{money(order.totalInKopecks)}</b></td></tr>{order.deliveryMethod === "delivery" && order.deliveryCostInKopecks > 0 && <tr><td>Ориентировочная стоимость доставки СДЭК</td><td /><td>{money(order.deliveryCostInKopecks)}</td></tr>}</>}</tbody></table>{order.paymentStatus === "PENDING" && order.status !== "CANCELLED" && paymentRetrySafe && <Link className="btn accent" href={`/api/payments/yookassa/${order.id}${guestAccess ? `?access=${query.access}` : ""}`}>Оплатить заказ</Link>}<div className="order-comment"><b>Комментарий к заказу</b><p>{order.comment?.trim() || "Не указан"}</p></div><h3>История</h3>{order.history.map(h => <p key={h.id}>{h.createdAt.toLocaleString("ru-RU")} · {statusLabel[h.status]}</p>)}</div>;
}
