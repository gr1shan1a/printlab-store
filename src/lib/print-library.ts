import { db } from "@/lib/db";
import { listPrintFiles, storePrintFile } from "@/lib/print-files";

export type LibraryPrintFile = {
  name: string;
  label: string;
  size: number;
  modifiedAt: string;
};

function fallbackLabel(fileName: string) {
  return fileName.replace(/-[0-9a-f]{8}-[0-9a-f-]{27}\.gcode\.3mf$/i, ".gcode.3mf");
}

export async function listPrintLibrary(): Promise<LibraryPrintFile[]> {
  const [files, metadata] = await Promise.all([
    listPrintFiles(),
    db.printFile.findMany({ select: { fileName: true, displayName: true } }),
  ]);
  const labels = new Map(metadata.map((file) => [file.fileName, file.displayName]));
  return files.map((file) => ({ ...file, label: labels.get(file.name) || fallbackLabel(file.name) }));
}

export async function addPrintFile(fileName: string, content: Buffer, displayName: string) {
  const stored = await storePrintFile(fileName, content);
  const label = displayName.trim().slice(0, 100) || fallbackLabel(fileName);
  await db.printFile.create({ data: { fileName: stored.name, displayName: label, size: stored.size } });
  return { ...stored, label };
}
