import { NextResponse } from "next/server";
import { findSessionImageAsset } from "@/lib/repository";
import { serveStoredFile } from "@/lib/api/route-helpers";
import { decodeSegment } from "@/lib/paths";

type Params = {
  params: Promise<{ ws: string; name: string; sessionId: string; imageId: string }>;
};

export async function GET(_req: Request, { params }: Params) {
  const { ws, name, sessionId, imageId } = await params;
  const asset = findSessionImageAsset(
    decodeSegment(ws),
    decodeSegment(name),
    sessionId,
    imageId,
  );
  if (!asset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return serveStoredFile(asset.path, asset.mime);
}
