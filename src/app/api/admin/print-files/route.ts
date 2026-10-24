import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { addPrintFile, listPrintLibrary } from "@/lib/print-library";

export const runtime = "nodejs";
const MAX_BYTES = 100 * 1024 * 1024;

async function requireAdmin() {
  const user = await currentUser();
  return user?.role === "ADMIN";
}

export async function GET() {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  return NextResponse.json({ files: await listPrintLibrary() });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string")
      return NextResponse.json({ error: "Выберите файл" }, { status: 400 });
    if (!file.size || file.size > MAX_BYTES)
      return NextResponse.json({ error: "Размер файла — от 1 байта до 100 МБ" }, { status: 413 });
    const suppliedName = form.get("displayName");
    const stored = await addPrintFile(file.name, Buffer.from(await file.arrayBuffer()), typeof suppliedName === "string" ? suppliedName : "");
    return NextResponse.json(stored, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Не удалось сохранить файл" }, { status: 400 });
  }
}
