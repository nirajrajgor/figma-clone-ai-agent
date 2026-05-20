import { NextResponse } from "next/server";
import { deleteSessionUploadDir } from "@/lib/images";
import { findSessionFromParams } from "@/lib/api/route-helpers";
import { decodeSegment } from "@/lib/paths";
import { imagePathsInDocument, requireSessionDocument } from "@/lib/markup/session-document";
import {
  deleteSession,
  saveSessionEditorState,
  updateSessionTitle,
} from "@/lib/repository";
import type { StoredSessionDocument } from "@/lib/markup/session-document";
import { toClientSessionDocument } from "@/lib/session-presenter";

type Params = {
  params: Promise<{ ws: string; name: string; sessionId: string }>;
};

export async function GET(_req: Request, { params }: Params) {
  const { ws, name, sessionId } = await params;
  const session = findSessionFromParams(ws, name, sessionId);
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const workspaceName = decodeSegment(ws);
  const projectName = decodeSegment(name);
  const document = toClientSessionDocument(workspaceName, projectName, session);
  return NextResponse.json({
    id: session.id,
    title: session.title,
    document,
  });
}

export async function PUT(req: Request, { params }: Params) {
  const { ws, name, sessionId } = await params;
  const workspaceName = decodeSegment(ws);
  const projectName = decodeSegment(name);
  const body = (await req.json()) as {
    document?: StoredSessionDocument;
    title?: string;
  };
  if (body.title !== undefined) {
    const trimmed = body.title.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }
    if (!updateSessionTitle(workspaceName, projectName, sessionId, trimmed)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }
  if (body.document !== undefined) {
    if (
      !saveSessionEditorState(workspaceName, projectName, sessionId, {
        document: body.document,
      })
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { ws, name, sessionId } = await params;
  const workspaceName = decodeSegment(ws);
  const projectName = decodeSegment(name);
  const session = findSessionFromParams(ws, name, sessionId);
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const document = requireSessionDocument(session.document);
  for (const path of imagePathsInDocument(document)) {
    deleteSessionUploadDir(path);
  }
  deleteSession(workspaceName, projectName, sessionId);
  return NextResponse.json({ ok: true });
}
