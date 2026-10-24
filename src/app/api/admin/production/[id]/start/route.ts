import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendFileToPrinter } from "@/lib/print-agent";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  const { id } = await params;
  const task = await db.productionTask.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: "Задача не найдена" }, { status: 404 });
  if (!task.printFileName) return NextResponse.json({ error: "Сначала выберите файл из библиотеки" }, { status: 400 });
  try { await sendFileToPrinter(task.printFileName); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Не удалось запустить печать" }, { status: 409 }); }
  const now = new Date();
  await db.$transaction(async tx => {
    await tx.productionTask.update({ where: { id }, data: { status: "PRINTING", startedAt: now, printer: "Bambu A1" } });
    if (task.customRequestId) await tx.contactMessage.update({ where: { id: task.customRequestId }, data: { workflowStatus: "IN_PRODUCTION", startedAt: now } });
    await tx.auditLog.create({ data: { actorId: user.id, action: "ADMIN_START_PRINT", entityType: "ProductionTask", entityId: id, before: { status: task.status }, after: { status: "PRINTING", printFileName: task.printFileName } } });
  });
  return NextResponse.json({ ok: true, message: "Файл передан принтеру" });
}
