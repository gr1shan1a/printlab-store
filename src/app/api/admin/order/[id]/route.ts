import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { z } from "zod";
import { changeOrderStatus } from "@/lib/order-status";
const schema = z.object({ status: z.nativeEnum(OrderStatus) });
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (user?.role !== "ADMIN")
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  const p = schema.safeParse(await req.json());
  if (!p.success)
    return NextResponse.json({ error: "Некорректный статус" }, { status: 400 });
  const { id } = await params;
  try {
    await changeOrderStatus(id,p.data.status,user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 409 },
    );
  }
}
