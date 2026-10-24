import { describe, expect, it } from "vitest";
import type { Order, OrderItem } from "@prisma/client";
import { orderCreatedAt, orderTelegramText, splitTelegramText } from "./order-display";

const order = {
  number: 20, paymentStatus: "PENDING", createdAt: new Date("2026-10-08T19:55:20Z"),
  firstName: "Иван", lastName: "Иванов", phone: "+79999999999", deliveryMethod: "delivery", deliveryProvider: "СДЭК",
  city: "Москва", address: "ул. Примерная, 1", deliveryPointCode: "MSK1", deliveryCostInKopecks: 30000, totalInKopecks: 64900,
  comment: "Первый ряд\n<не печатать как HTML> & сохранить комментарий", items: [{ productName: "Подставка", variantLabel: "Оранжевый", quantity: 1, priceInKopecks: 34900 }],
} as Order & { items: OrderItem[] };

describe("order messages", () => {
  it("includes unpaid state, complete comment, delivery and Moscow creation time", () => {
    const text = orderTelegramText(order, "created");
    expect(text).toContain("NOT PAID");
    expect(text).toContain(order.comment);
    expect(text).toContain("22:55:20 МСК");
    expect(text).toContain("Доставка:");
    expect(orderCreatedAt(order.createdAt)).toContain("08.10.2026");
  });
  it("reflects confirmed payment without calling it unpaid", () => {
    const text = orderTelegramText({ ...order, paymentStatus: "PAID" }, "paid");
    expect(text).toContain("Оплата получена");
    expect(text).toContain("Оплата: PAID");
    expect(text).not.toContain("NOT PAID");
  });
  it("splits long orders without losing comment characters or emoji", () => {
    const text = ("• Товар 🛒 <&>\n".repeat(700)) + order.comment;
    const chunks = splitTelegramText(text);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join("")).toBe(text);
    expect(chunks.every(chunk => chunk.length <= 3501)).toBe(true);
    expect(chunks.every(chunk => !/[\uD800-\uDBFF]$/.test(chunk))).toBe(true);
  });
});
