import { randomUUID } from "node:crypto";
import { mkdir, readdir, stat, statfs, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024;
const extensions = new Set(["stl", "obj", "3mf", "step", "stp"]);

export async function POST(req: NextRequest) {
  const [limit, globalLimit] = await Promise.all([
    rateLimit(`model-upload:${clientIp(req)}`, 5, 10 * 60_000),
    rateLimit("model-upload:global", 40, 60 * 60_000),
  ]);
  if (limit.limited || globalLimit.limited) return tooManyRequests(Math.max(limit.retryAfter, globalLimit.retryAfter), "Слишком много загрузок");
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string")
      return NextResponse.json({ error: "Выберите файл модели" }, { status: 400 });
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!extensions.has(extension))
      return NextResponse.json({ error: "Поддерживаются форматы STL, OBJ, 3MF, STEP" }, { status: 415 });
    if (!file.size || file.size > MAX_BYTES)
      return NextResponse.json({ error: "Размер файла — от 1 байта до 25 МБ" }, { status: 413 });
    const directory = path.join(process.cwd(), "public", "uploads", "models");
    await mkdir(directory, { recursive: true });
    const space = await statfs(directory);
    if (space.bavail * space.bsize < 1024 * 1024 * 1024 + file.size)
      return NextResponse.json({ error: "Загрузка временно недоступна" }, { status: 503 });
    let storedBytes = 0;
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.isFile()) storedBytes += (await stat(path.join(directory, entry.name))).size;
      if (storedBytes + file.size > 2 * 1024 * 1024 * 1024)
        return NextResponse.json({ error: "Загрузка временно недоступна" }, { status: 503 });
    }
    const content = Buffer.from(await file.arrayBuffer());
    if (extension === "3mf" && !(content[0] === 0x50 && content[1] === 0x4b))
      return NextResponse.json({ error: "Файл 3MF имеет неверный формат" }, { status: 400 });
    const name = `${Date.now()}-${randomUUID()}.${extension}`;
    await writeFile(path.join(directory, name), content, { flag: "wx", mode: 0o640 });
    return NextResponse.json({ url: `/uploads/models/${name}`, name: file.name, size: content.length }, { status: 201 });
  } catch (error) {
    console.error("3D model upload failed", error);
    return NextResponse.json({ error: "Не удалось загрузить модель" }, { status: 400 });
  }
}
