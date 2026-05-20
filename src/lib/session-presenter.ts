import { apiSessionImagePath, apiSessionThumbnailPath } from "@/lib/paths";
import { listSessions } from "@/lib/repository";
import type { SessionRow } from "@/lib/session-types";
import {
  requireSessionDocument,
  normalizeSessionDocument,
  type ClientSessionDocument,
  type StoredSessionDocument,
} from "@/lib/markup/session-document";

export function toSessionRows(
  workspace: string,
  project: string,
  sessions = listSessions(workspace, project),
): SessionRow[] {
  return sessions.map((s) => ({
    id: s.id,
    title: s.title,
    createdAt:
      s.createdAt instanceof Date ? s.createdAt.toISOString() : String(s.createdAt),
    thumbnailUrl: s.thumbnailPath
      ? apiSessionThumbnailPath(workspace, project, s.id)
      : null,
  }));
}

type SessionRecord = {
  id: string;
  title: string;
  document: StoredSessionDocument;
};

export function toClientSessionDocument(
  workspace: string,
  project: string,
  session: SessionRecord,
): ClientSessionDocument {
  const stored = normalizeSessionDocument(requireSessionDocument(session.document));
  const images = Object.fromEntries(
    Object.entries(stored.images).map(([id, image]) => [
      id,
      {
        id,
        url: apiSessionImagePath(workspace, project, session.id, id),
        width: image.width,
        height: image.height,
      },
    ]),
  );
  return {
    version: stored.version,
    activeArtboardId: stored.activeArtboardId,
    artboards: stored.artboards,
    images,
  };
}
