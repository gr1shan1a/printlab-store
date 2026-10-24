import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { printerStatus } from "@/lib/print-agent";

export async function GET() {
  const user = await currentUser();
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  try { return NextResponse.json(await printerStatus()); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Статус недоступен" }, { status: 502 }); }
}
