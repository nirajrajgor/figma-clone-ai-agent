import { NextResponse } from "next/server";
import { decodeSegment } from "@/lib/paths";
import { createProject, findProject, findWorkspaceByName } from "@/lib/repository";

type Params = { params: Promise<{ ws: string }> };

export async function POST(req: Request, { params }: Params) {
  const workspaceName = decodeSegment((await params).ws);
  const { name } = (await req.json()) as { name?: string };
  if (!findWorkspaceByName(workspaceName)) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  const trimmed = name.trim();
  if (findProject(workspaceName, trimmed)) {
    return NextResponse.json({ error: "Project already exists" }, { status: 409 });
  }
  createProject(workspaceName, trimmed);
  return NextResponse.json({ name: trimmed }, { status: 201 });
}
