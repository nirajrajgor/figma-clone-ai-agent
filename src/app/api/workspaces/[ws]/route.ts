import { NextResponse } from "next/server";
import { decodeSegment } from "@/lib/paths";
import { findWorkspaceByName } from "@/lib/repository";

type Params = { params: Promise<{ ws: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const name = decodeSegment((await params).ws);
    const workspace = findWorkspaceByName(name);
    return NextResponse.json({ exists: !!workspace });
  } catch (err) {
    console.error("GET /api/workspaces/[ws]", err);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
