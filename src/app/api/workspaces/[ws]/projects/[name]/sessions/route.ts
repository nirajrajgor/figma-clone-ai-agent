import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { apiSessionThumbnailPath, decodeSegment } from "@/lib/paths";
import { allowedImageMime, saveBaseImage } from "@/lib/images";
import { isUploadTooLarge, uploadTooLargeMessage } from "@/lib/upload-limits";
import { createSession, findProject, listSessions } from "@/lib/repository";

type Params = { params: Promise<{ ws: string; name: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { ws, name } = await params;
  const workspaceName = decodeSegment(ws);
  const projectName = decodeSegment(name);
  if (!findProject(workspaceName, projectName)) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const sessions = listSessions(workspaceName, projectName).map((s) => ({
    id: s.id,
    title: s.title,
    createdAt: s.createdAt,
    thumbnailUrl: s.thumbnailPath
      ? apiSessionThumbnailPath(workspaceName, projectName, s.id)
      : null,
  }));
  return NextResponse.json({ sessions });
}

export async function POST(req: Request, { params }: Params) {
  const { ws, name } = await params;
  const workspaceName = decodeSegment(ws);
  const projectName = decodeSegment(name);
  if (!findProject(workspaceName, projectName)) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const form = await req.formData();
  const title = String(form.get("title") ?? "").trim();
  const file = form.get("image");
  if (!title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image required" }, { status: 400 });
  }
  if (!allowedImageMime(file.type)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }
  if (isUploadTooLarge(file.size)) {
    return NextResponse.json({ error: uploadTooLargeMessage() }, { status: 413 });
  }
  const sessionId = randomUUID();
  const image = await saveBaseImage(sessionId, file);
  const session = createSession(workspaceName, projectName, title, {
    id: sessionId,
    path: image.path,
    mime: image.mime,
    width: image.width,
    height: image.height,
    thumbnailPath: image.thumbnailPath,
  });
  return NextResponse.json({ sessionId: session.id, title: session.title }, { status: 201 });
}
