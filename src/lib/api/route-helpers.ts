import fs from "fs";
import { NextResponse } from "next/server";
import { decodeSegment } from "@/lib/paths";
import { resolveStoredPath } from "@/lib/images";
import { findSession } from "@/lib/repository";

export function findSessionFromParams(ws: string, name: string, sessionId: string) {
  return findSession(decodeSegment(ws), decodeSegment(name), sessionId);
}

export function serveStoredFile(storedPath: string, contentType: string) {
  const filePath = resolveStoredPath(storedPath);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File missing" }, { status: 404 });
  }
  const body = fs.readFileSync(filePath);
  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
