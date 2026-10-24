import { randomUUID } from "node:crypto";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const directory = path.join(process.cwd(), "public", "uploads", "print-files");
const suffix = ".gcode.3mf";

export type PrintFile = {
  name: string;
  size: number;
  modifiedAt: string;
};

export function isPrintFileName(value: string) {
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.gcode\.3mf$/.test(value);
}

export async function listPrintFiles(): Promise<PrintFile[]> {
  await mkdir(directory, { recursive: true });
  const names = (await readdir(directory)).filter(isPrintFileName);
  const rows = await Promise.all(
    names.map(async (name) => {
      const info = await stat(path.join(directory, name));
      return { name, size: info.size, modifiedAt: info.mtime.toISOString() };
    }),
  );
  return rows.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}

export async function storePrintFile(originalName: string, content: Buffer) {
  if (!originalName.toLowerCase().endsWith(suffix))
    throw new Error("Нужен готовый файл .gcode.3mf");
  if (content.length < 4 || content[0] !== 0x50 || content[1] !== 0x4b)
    throw new Error("Файл должен быть корректным 3MF-архивом");
  await mkdir(directory, { recursive: true });
  const stem = path
    .basename(originalName, suffix)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "print";
  const name = `${stem}-${randomUUID()}${suffix}`;
  await writeFile(path.join(directory, name), content, { flag: "wx", mode: 0o640 });
  return { name, size: content.length };
}
