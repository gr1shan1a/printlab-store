import { listPrintFiles } from "@/lib/print-files";

export async function sendFileToPrinter(name: string) {
  if (!(await listPrintFiles()).some((file) => file.name === name))
    throw new Error("Файл не найден в библиотеке");
  const endpoint = process.env.PRINT_AGENT_URL;
  const token = process.env.PRINT_AGENT_TOKEN;
  const baseUrl = process.env.NEXT_PUBLIC_STORE_URL;
  if (!endpoint || !token || !baseUrl)
    throw new Error("Print-agent не настроен");
  let response: Response;
  try {
    response = await fetch(`${endpoint.replace(/\/$/, "")}/v1/print`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-print-agent-token": token },
      body: JSON.stringify({
        fileUrl: `${baseUrl.replace(/\/$/, "")}/uploads/print-files/${encodeURIComponent(name)}`,
        displayName: name,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new Error("Raspberry print-agent недоступен");
  }
  const body = await response.json().catch(() => null) as { error?: string } | null;
  if (!response.ok) throw new Error(body?.error || "Принтер не подтвердил запуск");
  return body;
}

export async function printerStatus() {
  const endpoint = process.env.PRINT_AGENT_URL;
  const token = process.env.PRINT_AGENT_TOKEN;
  if (!endpoint || !token) throw new Error("Print-agent не настроен");
  let response: Response;
  try {
    response = await fetch(`${endpoint.replace(/\/$/, "")}/v1/status`, {
      headers: { "x-print-agent-token": token },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error("Raspberry print-agent недоступен");
  }
  const body = await response.json().catch(() => null) as { error?: string } | null;
  if (!response.ok) throw new Error(body?.error || "Статус принтера недоступен");
  return body;
}
