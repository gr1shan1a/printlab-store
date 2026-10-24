import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/money";
import { orderCreatedAt, paymentStatusLabel } from "@/lib/order-display";
import { statusLabel } from "@/lib/status";

export default async function Account() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const orders = await db.order.findMany({
    where: { userId: user.id, hiddenByUser: false },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  const activeOrders = orders.filter((order) => !["COMPLETED", "CANCELLED"].includes(order.status));
  const paidTotal = orders.filter((order) => order.paymentStatus === "PAID").reduce((sum, order) => sum + order.totalInKopecks, 0);
  const initials = (user.name || user.email).slice(0, 1).toUpperCase();

  return <div className="container account-page">
    <section className="account-hero">
      <div className="profile-avatar" aria-hidden="true">{initials}</div>
      <div className="account-intro">
        <div className="eyebrow">Личный кабинет</div>
        <h1>{user.name || "Ваш профиль"}</h1>
        <p>{user.email}{user.phone ? ` · ${user.phone}` : ""}</p>
      </div>
      <Link className="btn account-catalog-link" href="/catalog">В каталог <span>→</span></Link>
    </section>

    <section className="account-stats" aria-label="Статистика заказов">
      <div><span>Всего заказов</span><b>{orders.length}</b></div>
      <div><span>В работе</span><b>{activeOrders.length}</b></div>
      <div><span>Оплачено</span><b>{money(paidTotal)}</b></div>
    </section>

    <section className="account-content">
      <div className="account-orders">
        <div className="account-section-head">
          <div><div className="eyebrow">Покупки</div><h2>Мои заказы</h2></div>
          <span>{orders.length ? `${orders.length} ${orders.length === 1 ? "заказ" : "заказа"}` : "Пока пусто"}</span>
        </div>
        {orders.length ? <div className="order-list">{orders.map((order) => {
          const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
          return <Link className="account-order" href={`/order/${order.id}`} key={order.id}>
            <div className="account-order-number"><span>Заказ</span><b>#{order.number}</b></div>
            <div className="account-order-main"><b>{order.items.map((item) => item.productName).slice(0, 2).join(", ")}{order.items.length > 2 ? " и ещё" : ""}</b><small>{itemCount} шт. · {orderCreatedAt(order.createdAt)}</small></div>
            <div className="account-order-status"><span className={`order-status status-${order.status.toLowerCase()}`}>{statusLabel[order.status]}</span><small>{paymentStatusLabel[order.paymentStatus]}</small></div>
            <div className="account-order-total"><b>{money(order.totalInKopecks)}</b><span>→</span></div>
          </Link>;
        })}</div> : <div className="account-empty"><div className="account-empty-icon">◌</div><h3>Здесь появятся ваши заказы</h3><p>Выберите готовое изделие или отправьте задачу на 3D-печать.</p><Link className="btn accent" href="/catalog">Открыть каталог</Link></div>}
      </div>
      <aside className="account-help">
        <div className="eyebrow">Нужна деталь?</div><h3>Напечатаем по вашей задаче</h3><p>Пришлите ссылку на 3D-модель или опишите, что нужно сделать.</p><Link href="/3d-pechat-na-zakaz">Оставить заявку <span>→</span></Link>
      </aside>
    </section>
  </div>;
}
