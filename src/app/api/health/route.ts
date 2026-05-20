import { NextResponse } from "next/server";
import { checkDb } from "@/lib/db";

export async function GET() {
  const database = checkDb() ? "ok" : "error";
  const ok = database === "ok";
  return NextResponse.json(
    { status: ok ? "ok" : "degraded", database },
    { status: ok ? 200 : 503 },
  );
}
