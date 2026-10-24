import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { createCdekOrder, syncCdekOrder } from "@/lib/cdek";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    select: { id: true, cdekOrderUuid: true, paymentStatus: true, deliveryMethod: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  if (order.deliveryMethod !== "delivery") {
    return NextResponse.json({ error: "Для этого заказа выбрана доставка самовывозом" }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action || (order.cdekOrderUuid ? "sync" : "create");

    if (action === "sync") {
      const result = await syncCdekOrder(id);
      return NextResponse.json({ ok: true, ...result });
    } else {
      const result = await createCdekOrder(id);
      return NextResponse.json({ ok: true, ...result });
    }
  } catch (error) {
    console.error("CDEK order operation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось выполнить операцию со СДЭК" },
      { status: 400 },
    );
  }
}
