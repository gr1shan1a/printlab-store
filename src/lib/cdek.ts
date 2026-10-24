import { cdekDownloadUrl } from "@/lib/cdek-download";
type CdekToken = { value: string; expiresAt: number };
let tokenCache: CdekToken | null = null;

async function token() {
  if (tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.value;
  const clientId = process.env.CDEK_CLIENT_ID;
  const clientSecret = process.env.CDEK_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("CDEK_NOT_CONFIGURED");
  const body = new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret });
  const response = await fetch("https://api.cdek.ru/v2/oauth/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body, signal: AbortSignal.timeout(8000), cache: "no-store" });
  if (!response.ok) throw new Error("CDEK_AUTH_FAILED");
  const data = await response.json() as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("CDEK_AUTH_FAILED");
  tokenCache = { value: data.access_token, expiresAt: Date.now() + Math.max(60, (data.expires_in || 3600) - 60) * 1000 };
  return tokenCache.value;
}

export async function cdekRequest<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`https://api.cdek.ru/v2${path}`, { ...init, headers: { Authorization: `Bearer ${await token()}`, "content-type": "application/json", ...init.headers }, signal: AbortSignal.timeout(12000), cache: "no-store" });
  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`CDEK_REQUEST_FAILED_${response.status}: ${errorBody}`);
  }
  return response.json() as Promise<T>;
}

export async function calculateCdekDelivery(input: { destinationCityCode: number; deliveryPointCode?: string; weightGrams: number }) {
  const originCityCode = Number(process.env.CDEK_ORIGIN_CITY_CODE || process.env.CDEK_CITY_CODE || 137);
  const tariffCode = Number(process.env.CDEK_TARIFF_CODE || 136); // standard parcel, warehouse to warehouse
  if (!Number.isInteger(input.destinationCityCode) || input.destinationCityCode <= 0) throw new Error("CDEK_CITY_INVALID");
  const result = await cdekRequest<{ delivery_sum?: number; period_min?: number; period_max?: number }>("/calculator/tariff", { method: "POST", body: JSON.stringify({ tariff_code: tariffCode, from_location: { code: originCityCode }, to_location: { code: input.destinationCityCode }, ...(input.deliveryPointCode?{delivery_point:input.deliveryPointCode}:{}), packages: [{ weight: Math.max(100, Math.ceil(input.weightGrams)) }] }) });
  const rubles = Number(result.delivery_sum);
  if (!Number.isFinite(rubles) || rubles < 0) throw new Error("CDEK_PRICE_INVALID");
  return { costInKopecks: Math.ceil(rubles * 100), periodMin: result.period_min, periodMax: result.period_max };
}

export type CdekOrderEntity = {
  uuid?: string;
  cdek_number?: string;
  number?: string;
  tariff_code?: number;
  delivery_point?: string;
  shipment_point?: string;
  statuses?: { code?: string; name?: string; date_time?: string }[];
  delivery_detail?: { delivery_sum?: number; total_sum?: number };
};

export type CdekOrderResponse = {
  entity?: { uuid?: string };
  requests?: { request_uuid?: string; type?: string; state?: string; errors?: { code?: string; message?: string }[]; warnings?: { code?: string; message?: string }[] }[];
};

export type CdekOrderDetailsResponse = {
  entity?: CdekOrderEntity;
  requests?: { state?: string; errors?: { code?: string; message?: string }[] }[];
};

export async function createCdekOrder(orderId: string) {
  const { db } = await import("@/lib/db");
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { select: { weightGrams: true } },
            },
          },
        },
      },
    },
  });
  if (!order) throw new Error("Заказ не найден");
  if (order.deliveryMethod !== "delivery") throw new Error("Заказ оформлен как самовывоз");
  if (!order.deliveryPointCode) throw new Error("Не указан пункт выдачи СДЭК");

  if (order.cdekOrderUuid) {
    return syncCdekOrder(orderId);
  }

  const originCityCode = Number(process.env.CDEK_ORIGIN_CITY_CODE || process.env.CDEK_CITY_CODE || 137);
  const tariffCode = Number(process.env.CDEK_TARIFF_CODE || 136);
  const shipmentPoint = process.env.CDEK_SHIPMENT_POINT || "SPB56";
  const storeName = "FORM3D";
  const rawPhone = (order.phone || "").replace(/[^\d+]/g, "");
  const cleanPhone = rawPhone.startsWith("+") ? rawPhone : `+${rawPhone}`;

  const items = order.items.map((item) => {
    const itemWeight = Math.max(50, item.variant?.product?.weightGrams || 100);
    const costRubles = Math.max(1, Math.round(item.priceInKopecks / 100));
    return {
      name: item.productName.slice(0, 250),
      ware_key: (item.sku || item.id).slice(0, 30),
      payment: { value: 0 }, // Заказ оплачен онлайн
      cost: costRubles,
      weight: itemWeight,
      amount: item.quantity,
    };
  });

  const totalWeight = Math.max(100, items.reduce((sum, it) => sum + it.weight * it.amount, 0));

  const payload = {
    type: 1, // Интернет-магазин
    number: `PL-${order.number}`,
    comment: `Заказ #${order.number} FORM3D`,
    tariff_code: tariffCode,
    ...(shipmentPoint ? { shipment_point: shipmentPoint } : { from_location: { code: originCityCode } }),
    delivery_point: order.deliveryPointCode,
    recipient: {
      name: `${order.firstName} ${order.lastName}`.trim(),
      phones: [{ number: cleanPhone }],
      ...(order.email ? { email: order.email } : {}),
    },
    sender: {
      company: storeName,
      name: storeName,
      phones: [{ number: (process.env.STORE_PHONE || "+79807106171").replace(/[^\d+]/g, "") }],
    },
    packages: [
      {
        number: "1",
        weight: totalWeight,
        length: 15,
        width: 15,
        height: 10,
        comment: "3D-печать",
        items,
      },
    ],
  };

  const response = await cdekRequest<CdekOrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const requestInfo = response.requests?.[0];
  if (requestInfo?.state === "INVALID") {
    const errorMsg = requestInfo.errors?.map((e) => e.message).join(", ") || "Ошибка валидации СДЭК";
    throw new Error(`СДЭК отклонил заказ: ${errorMsg}`);
  }

  const uuid = response.entity?.uuid;
  if (!uuid) throw new Error("СДЭК не вернул идентификатор заказа");

  await db.order.update({
    where: { id: order.id },
    data: { cdekOrderUuid: uuid },
  });

  // Даем СДЭК 1.5 секунды на первичное присвоение трек-номера
  await new Promise((r) => setTimeout(r, 1500));
  return syncCdekOrder(order.id);
}

export async function syncCdekOrder(orderId: string) {
  const { db } = await import("@/lib/db");
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, cdekOrderUuid: true, cdekTrackingNumber: true, cdekStatus: true },
  });
  if (!order || !order.cdekOrderUuid) throw new Error("Заказ в СДЭК ещё не зарегистрирован");

  const details = await cdekRequest<CdekOrderDetailsResponse>(`/orders/${order.cdekOrderUuid}`);
  const entity = details.entity;
  const trackingNumber = entity?.cdek_number || order.cdekTrackingNumber || null;
  const statusName = entity?.statuses?.[0]?.name || order.cdekStatus || null;

  const updated = await db.order.update({
    where: { id: order.id },
    data: {
      cdekTrackingNumber: trackingNumber,
      cdekStatus: statusName,
    },
  });

  return {
    uuid: order.cdekOrderUuid,
    trackingNumber: updated.cdekTrackingNumber,
    status: updated.cdekStatus,
    deliveryPoint: entity?.delivery_point,
    shipmentPoint: entity?.shipment_point,
  };
}

export async function getCdekPrintBuffer(orderUuid: string, type: "orders" | "barcodes" = "orders"): Promise<{ buffer: Buffer; contentType: string }> {
  const payload = type === "barcodes"
    ? { orders: [{ order_uuid: orderUuid }], copy_count: 1 }
    : { orders: [{ order_uuid: orderUuid }] };

  const printReq = await cdekRequest<{ entity?: { uuid?: string } }>(`/print/${type}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const printUuid = printReq.entity?.uuid;
  if (!printUuid) throw new Error("Не удалось сформировать квитанцию в СДЭК");

  // Опрашиваем готовность PDF до 6 раз
  let fileUrl: string | null = null;
  for (let i = 0; i < 6; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const statusRes = await cdekRequest<{ entity?: { url?: string; statuses?: { code?: string }[] } }>(`/print/${type}/${printUuid}`);
      if (statusRes.entity?.url) {
        fileUrl = statusRes.entity.url;
        break;
      }
    } catch {
      // повтор
    }
  }

  const downloadUrl = cdekDownloadUrl(fileUrl || `https://api.cdek.ru/v2/print/${type}/${printUuid}.pdf`);
  const headers: Record<string, string> = {};
  if (downloadUrl.hostname === "api.cdek.ru") {
    headers["Authorization"] = `Bearer ${await token()}`;
  }

  const fileRes = await fetch(downloadUrl, { headers, redirect: "error", signal: AbortSignal.timeout(15_000) });
  if (!fileRes.ok) throw new Error(`Не удалось скачать файл квитанции СДЭК (${fileRes.status})`);
  if (Number(fileRes.headers.get("content-length") || 0) > 10 * 1024 * 1024) throw new Error("Квитанция слишком большая");
  const reader = fileRes.body?.getReader();
  if (!reader) throw new Error("Пустая квитанция");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 10 * 1024 * 1024) { await reader.cancel(); throw new Error("Квитанция слишком большая"); }
    chunks.push(value);
  }
  const pdf = Buffer.concat(chunks);
  if (pdf.subarray(0, 5).toString() !== "%PDF-") throw new Error("СДЭК вернул неверный формат квитанции");
  return {
    buffer: pdf,
    contentType: "application/pdf",
  };
}

