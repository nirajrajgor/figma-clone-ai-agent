import { NextResponse } from "next/server";
import { composeExport } from "@/lib/export/compositor";
import {
  exportContentType,
  exportFilename,
  parseExportOptions,
} from "@/lib/export/export-options";
import { layoutFromArtboard } from "@/lib/markup/artboard-layout";
import { resolveImageCrop } from "@/lib/markup/image-crop";
import { resolveStoredPath } from "@/lib/images";
import { getActiveArtboard, resolveFrameCornerRadius, resolveImageOpacity } from "@/lib/markup/session-document";
import { decodeSegment } from "@/lib/paths";
import { findSession, sessionDocument } from "@/lib/repository";

type Params = {
  params: Promise<{ ws: string; name: string; sessionId: string }>;
};

async function exportSession(
  req: Request,
  { params }: Params,
  body?: Record<string, string | number>,
) {
  const { ws, name, sessionId } = await params;
  const session = findSession(decodeSegment(ws), decodeSegment(name), sessionId);
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const document = sessionDocument(session);
  const active = getActiveArtboard(document);
  const image = active?.imageId ? document.images[active.imageId] : null;
  if (!active || !image) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const searchParams = new URL(req.url).searchParams;
  const options = parseExportOptions(searchParams, body);
  if ("error" in options) {
    return NextResponse.json({ error: options.error }, { status: 400 });
  }

  const crop = resolveImageCrop(active, image.width, image.height);
  const layout = layoutFromArtboard(active, image.width, image.height, crop.width, crop.height);
  const bytes = await composeExport(
    resolveStoredPath(image.path),
    active.markupStack,
    image.width,
    image.height,
    layout,
    crop,
    options,
    {
      imageOpacity: resolveImageOpacity(active),
      frameCornerRadius: resolveFrameCornerRadius(active),
    },
  );

  const filename = exportFilename(session.title || "export", options);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": exportContentType(options),
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(req: Request, ctx: Params) {
  return exportSession(req, ctx);
}

export async function POST(req: Request, ctx: Params) {
  let body: Record<string, string | number> | undefined;
  try {
    const json = (await req.json()) as Record<string, string | number>;
    body = json;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  return exportSession(req, ctx, body);
}
