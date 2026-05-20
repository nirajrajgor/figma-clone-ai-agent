import { NextResponse } from "next/server";
import { findSessionFromParams, serveStoredFile } from "@/lib/api/route-helpers";

type Params = {
  params: Promise<{ ws: string; name: string; sessionId: string }>;
};

export async function GET(_req: Request, { params }: Params) {
  const { ws, name, sessionId } = await params;
  const session = findSessionFromParams(ws, name, sessionId);
  if (!session?.thumbnailPath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return serveStoredFile(session.thumbnailPath, "image/jpeg");
}
