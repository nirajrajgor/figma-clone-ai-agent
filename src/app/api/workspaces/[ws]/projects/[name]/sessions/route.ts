import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { apiSessionThumbnailPath, decodeSegment } from "@/lib/paths";
import { allowedImageMime, saveBaseImage } from "@/lib/images";
import { resolveFrameSizeFromForm } from "@/lib/markup/frame-preset-sizes";
import { isUploadTooLarge, uploadTooLargeMessage } from "@/lib/upload-limits";
import { createSession, findProject, listSessions } from "@/lib/repository";

type Params = { params: Promise<{ ws: string; name: string }> };

/**
 * POST multipart fields:
 * - title (required)
 * - image (optional) — PNG/JPEG/WebP file
 * - preset (optional) — phone | tablet | desktop
 * - frameWidth, frameHeight (optional) — custom blank frame size
 */
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

function isImageFile(file: FormDataEntryValue | null): file is File {
  return file instanceof File && file.size > 0;
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

  const frameSize = resolveFrameSizeFromForm(form);

  if (!isImageFile(file)) {
    const session = createSession(workspaceName, projectName, title, undefined, {
      frameSize,
    });
    return NextResponse.json(
      { sessionId: session.id, title: session.title },
      { status: 201 },
    );
  }

  if (!allowedImageMime(file.type)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }
  if (isUploadTooLarge(file.size)) {
    return NextResponse.json({ error: uploadTooLargeMessage() }, { status: 413 });
  }
  const sessionId = randomUUID();
  const image = await saveBaseImage(sessionId, file);
  const session = createSession(
    workspaceName,
    projectName,
    title,
    {
      path: image.path,
      mime: image.mime,
      width: image.width,
      height: image.height,
      thumbnailPath: image.thumbnailPath,
    },
    { sessionId, frameSize },
  );
  return NextResponse.json({ sessionId: session.id, title: session.title }, { status: 201 });
}
