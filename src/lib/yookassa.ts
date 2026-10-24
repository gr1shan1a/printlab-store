export type YooKassaPayment = {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  paid: boolean;
  amount: { value: string; currency: string };
  metadata?: { orderId?: string };
  confirmation?: { confirmation_url?: string };
};

import { guestOrderToken } from "@/lib/guest-order";

function credentials() {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) throw new Error("ЮKassa не настроена");
  return { shopId, secretKey };
}

async function request<T>(path: string, init: RequestInit = {}) {
  const { shopId, secretKey } = credentials();
  const response = await fetch(`https://api.yookassa.ru/v3${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`ЮKassa ${response.status}: ${body}`);
  return JSON.parse(body) as T;
}

export async function createYooKassaPayment(input: {
  orderId: string;
  orderNumber: number;
  idempotenceKey: string;
  amountInKopecks: number;
  description: string;
  email: string;
  items: { description: string; quantity: number; amountInKopecks: number; paymentSubject?: "commodity" | "service" }[];
}) {
  const baseUrl = process.env.NEXT_PUBLIC_STORE_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_STORE_URL не настроен");
  return request<YooKassaPayment>("/payments", {
    method: "POST",
    headers: { "Idempotence-Key": input.idempotenceKey },
    body: JSON.stringify({
      amount: { value: (input.amountInKopecks / 100).toFixed(2), currency: "RUB" },
      capture: true,
      description: `Заказ #${input.orderNumber}: ${input.description}`,
      metadata: { orderId: input.orderId },
      receipt: {
        customer: { email: input.email },
        items: input.items.map(item => ({
          description: item.description.slice(0, 128),
          quantity: item.quantity,
          amount: { value: (item.amountInKopecks / 100).toFixed(2), currency: "RUB" },
          vat_code: 1,
          payment_mode: "full_payment",
          payment_subject: item.paymentSubject || "commodity",
        })),
      },
      confirmation: { type: "redirect", return_url: `${baseUrl}/order/${input.orderId}?payment=success&access=${guestOrderToken(input.orderId)}` },
    }),
  });
}

export function getYooKassaPayment(id: string) {
  return request<YooKassaPayment>(`/payments/${encodeURIComponent(id)}`);
}
