import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProductionStatus } from "@prisma/client";
import { z } from "zod";
import { sendAdmin } from "@/lib/telegram";
const schema = z.object({ status: z.nativeEnum(ProductionStatus) });
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
  const old = await db.productionTask.findUnique({ where: { id } });
  if (!old)
    return NextResponse.json({ error: "Задача не найдена" }, { status: 404 });
  await db.$transaction(async tx => {
    const task = await tx.productionTask.update({
      where: { id },
      data: {
        status: p.data.status,
        startedAt: p.data.status === "PRINTING" ? new Date() : undefined,
        completedAt: p.data.status === "COMPLETED" ? new Date() : undefined,
      },
    });
    if (task.customRequestId && p.data.status === "PRINTING")
      await tx.contactMessage.update({where:{id:task.customRequestId},data:{workflowStatus:"IN_PRODUCTION",startedAt:new Date()}});
    if (task.customRequestId && p.data.status === "COMPLETED")
      await tx.contactMessage.update({where:{id:task.customRequestId},data:{workflowStatus:"READY",readyAt:new Date()}});
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "ADMIN_CHANGE_PRODUCTION_STATUS",
        entityType: "ProductionTask",
        entityId: id,
        before: { status: old.status },
        after: { status: p.data.status },
      },
    });
  });
  sendAdmin(`🖨 Статус печати изменён: ${p.data.status}`).catch(console.error);
  return NextResponse.json({ ok: true });
}
