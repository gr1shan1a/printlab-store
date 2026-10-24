import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { isPrintFileName, listPrintFiles } from "@/lib/print-files";

const schema = z.object({ name: z.string().min(1).max(180) });

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (user?.role !== "ADMIN")
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success || !isPrintFileName(parsed.data.name))
    return NextResponse.json({ error: "Некорректный файл" }, { status: 400 });
  if (!(await listPrintFiles()).some((file) => file.name === parsed.data.name))
    return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  const endpoint = process.env.PRINT_AGENT_URL;
  const token = process.env.PRINT_AGENT_TOKEN;
  const baseUrl = process.env.NEXT_PUBLIC_STORE_URL;
  if (!endpoint || !token || !baseUrl)
    return NextResponse.json({ error: "Print-agent не настроен" }, { status: 503 });
  let agent: Response;
  try {
    agent = await fetch(`${endpoint.replace(/\/$/, "")}/v1/print`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-print-agent-token": token },
      body: JSON.stringify({
        fileUrl: `${baseUrl.replace(/\/$/, "")}/uploads/print-files/${encodeURIComponent(parsed.data.name)}`,
        displayName: parsed.data.name,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    return NextResponse.json({ error: "Raspberry print-agent недоступен" }, { status: 502 });
  }
  const body = await agent.json().catch(() => null) as { error?: string } | null;
  if (!agent.ok)
    return NextResponse.json({ error: body?.error || "Принтер не подтвердил запуск" }, { status: 409 });
  return NextResponse.json({ ok: true, message: "Файл передан принтеру" });
}
