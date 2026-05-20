import { NextResponse } from "next/server";
import { decodeSegment } from "@/lib/paths";
import { deleteProject, findProject } from "@/lib/repository";

type Params = { params: Promise<{ ws: string; name: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { ws, name } = await params;
  const project = findProject(decodeSegment(ws), decodeSegment(name));
  return NextResponse.json({ exists: !!project });
}

export async function DELETE(req: Request, { params }: Params) {
  const { ws, name } = await params;
  const projectName = decodeSegment(name);
  const body = (await req.json()) as { confirmName?: string };
  if (body.confirmName !== projectName) {
    return NextResponse.json({ error: "Confirmation mismatch" }, { status: 400 });
  }
  const ok = deleteProject(decodeSegment(ws), projectName);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
