import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPrintFileName, listPrintFiles } from "@/lib/print-files";
import { z } from "zod";

const schema = z.object({ name: z.string().min(1).max(180) });
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success || !isPrintFileName(parsed.data.name)) return NextResponse.json({ error: "Некорректный файл" }, { status: 400 });
  if (!(await listPrintFiles()).some((file) => file.name === parsed.data.name)) return NextResponse.json({ error: "Файл не найден в библиотеке" }, { status: 404 });
  const { id } = await params;
  const old = await db.productionTask.findUnique({ where: { id } });
  if (!old) return NextResponse.json({ error: "Задача не найдена" }, { status: 404 });
  await db.$transaction([
    db.productionTask.update({ where: { id }, data: { printFileName: parsed.data.name } }),
    db.auditLog.create({ data: { actorId: user.id, action: "ADMIN_ASSIGN_PRINT_FILE", entityType: "ProductionTask", entityId: id, before: { printFileName: old.printFileName }, after: { printFileName: parsed.data.name } } }),
  ]);
  return NextResponse.json({ ok: true });
}
