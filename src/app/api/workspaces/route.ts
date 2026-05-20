import { NextResponse } from "next/server";
import { createWorkspace, findWorkspaceByName } from "@/lib/repository";

export async function POST(req: Request) {
  try {
    const { name } = (await req.json()) as { name?: string };
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }
    const trimmed = name.trim();
    if (findWorkspaceByName(trimmed)) {
      return NextResponse.json({ error: "Workspace already exists" }, { status: 409 });
    }
    createWorkspace(trimmed);
    return NextResponse.json({ name: trimmed }, { status: 201 });
  } catch (err) {
    console.error("POST /api/workspaces", err);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
