import { NextResponse } from "next/server";
import { decodeSegment } from "@/lib/paths";
import { allowedImageMime, saveBaseImage } from "@/lib/images";
import { isUploadTooLarge, uploadTooLargeMessage } from "@/lib/upload-limits";
import { findSession, replaceSessionBaseImage } from "@/lib/repository";

type Params = {
  params: Promise<{ ws: string; name: string; sessionId: string }>;
};

export async function PUT(req: Request, { params }: Params) {
  const { ws, name, sessionId } = await params;
  const workspaceName = decodeSegment(ws);
  const projectName = decodeSegment(name);
  const session = findSession(workspaceName, projectName, sessionId);
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const form = await req.formData();
  const file = form.get("image");
  if (!(file instanceof File) || !allowedImageMime(file.type)) {
    return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  }
  if (isUploadTooLarge(file.size)) {
    return NextResponse.json({ error: uploadTooLargeMessage() }, { status: 413 });
  }
  const keepMarkup = form.get("keepMarkup") === "true";
  const image = await saveBaseImage(sessionId, file);
  replaceSessionBaseImage(workspaceName, projectName, sessionId, image, { keepMarkup });
  return NextResponse.json({ ok: true });
}
