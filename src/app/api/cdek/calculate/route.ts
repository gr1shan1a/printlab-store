import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { calculateCdekDelivery } from "@/lib/cdek";
import { z } from "zod";

const schema = z.object({
  cityCode: z.number().int().positive(),
  officeCode: z.string().trim().min(1).max(40),
  items: z.array(z.object({ variantId: z.string().cuid(), quantity: z.number().int().min(1).max(99) })).min(1).max(50),
});

export async function POST(request: NextRequest) {
  const limit = await rateLimit(`cdek-calculate:${clientIp(request)}`, 60, 10 * 60_000);
  if (limit.limited) return tooManyRequests(limit.retryAfter);
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Некорректные данные доставки" }, { status: 400 });
    const variants = await db.productVariant.findMany({ where: { id: { in: parsed.data.items.map(item => item.variantId) }, active: true }, select: { id: true, product: { select: { weightGrams: true } } } });
    const weights = new Map(variants.map(variant => [variant.id, variant.product.weightGrams || 100]));
    const weight = parsed.data.items.reduce((sum, item) => sum + (weights.get(item.variantId) || 100) * item.quantity, 0);
    const estimate = await calculateCdekDelivery({ destinationCityCode: parsed.data.cityCode, deliveryPointCode: parsed.data.officeCode, weightGrams: weight });
    return NextResponse.json({ ...estimate, weightGrams: weight, approximate: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("CDEK calculation failed", error);
    return NextResponse.json({ error: "Не удалось рассчитать стоимость СДЭК" }, { status: 502 });
  }
}
