import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getCdekPrintBuffer } from "@/lib/cdek";
import { db } from "@/lib/db";

export async function GET(
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
    select: { id: true, number: true, cdekOrderUuid: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  if (!order.cdekOrderUuid) {
    return NextResponse.json({ error: "Заказ ещё не зарегистрирован в СДЭК" }, { status: 400 });
  }

  const typeParam = req.nextUrl.searchParams.get("type");
  const type: "orders" | "barcodes" = typeParam === "barcodes" ? "barcodes" : "orders";

  try {
    const { buffer, contentType } = await getCdekPrintBuffer(order.cdekOrderUuid, type);
    const filename = `cdek-${order.number}-${type === "barcodes" ? "barcode" : "waybill"}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to generate CDEK print PDF:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось сформировать квитанцию СДЭК" },
      { status: 502 },
    );
  }
}
