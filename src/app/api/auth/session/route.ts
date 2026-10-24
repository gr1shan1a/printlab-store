import { NextResponse } from "next/server";
import { refreshSession } from "@/lib/auth";

export async function GET() {
  const active = await refreshSession();
  return NextResponse.json({ active }, { headers: { "Cache-Control": "no-store" } });
}
