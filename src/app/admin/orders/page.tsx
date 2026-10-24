import { db } from "@/lib/db";
import { money } from "@/lib/money";
import { orderCreatedAt, paymentStatusLabel } from "@/lib/order-display";
import { StatusForm } from "@/components/StatusForm";
import { CdekOrderActions } from "@/components/CdekOrderActions";

export default async function Orders() {
  const rows = await db.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" } });
  return <><div className="eyebrow">Продажи</div><h2>Заказы</h2>
    <div className="admin-table-wrap" style={{ marginTop: 30 }}><table className="orders-table">
      <thead><tr>
        <th>Номер / создан</th>
        <th>Клиент</th>
        <th>Доставка / СДЭК</th>
        <th>Позиции / комментарий</th>
        <th>Сумма</th>
        <th>Оплата</th>
        <th>Статус заказа</th>
      </tr></thead>
      <tbody>{rows.map(order => <tr key={order.id}>
        <td><b>#{order.number}</b><small className="order-created-at"><time dateTime={order.createdAt.toISOString()}>{orderCreatedAt(order.createdAt)}</time></small></td>
        <td>
          <b>{order.firstName} {order.lastName}</b><br/>
          <span style={{ fontSize: 13 }}>{order.phone}</span>
          {order.email && <small className="muted" style={{ display: "block" }}>{order.email}</small>}
        </td>
        <td style={{ minWidth: 220 }}>
          <div style={{ fontSize: 13, lineHeight: 1.3 }}>
            <div><b>{order.deliveryMethod === "pickup" ? "Самовывоз" : (order.deliveryProvider || "СДЭК")}</b></div>
            {order.deliveryMethod === "delivery" && (
              <div style={{ color: "var(--muted)", marginTop: 2 }}>{order.city}, {order.address}</div>
            )}
          </div>
          <CdekOrderActions order={order} />
        </td>
        <td>{order.items.map(item => <div key={item.id}>{item.productName} · {item.quantity}</div>)}
          <div className="order-comment"><b>Комментарий</b><p>{order.comment?.trim() || "Не указан"}</p></div>
        </td>
        <td>{money(order.totalInKopecks)}{order.deliveryCostInKopecks > 0 && <small className="order-created-at">Доставка: {money(order.deliveryCostInKopecks)}</small>}</td>
        <td><span className={`order-status status-${order.paymentStatus.toLowerCase()}`}>{paymentStatusLabel[order.paymentStatus]}</span></td>
        <td><StatusForm id={order.id} status={order.status} kind="order"/></td>
      </tr>)}</tbody>
    </table></div></>;
}
