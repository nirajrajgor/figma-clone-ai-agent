import { randomUUID } from "crypto";
import { cache } from "react";
import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "./db";
import { deleteSessionUploadDir } from "./images";
import { mergeReplacedBaseImage } from "./markup/replace-base-image";
import {
  createBlankInitialSessionDocument,
  createInitialSessionDocument,
  imagePathsInDocument,
  requireSessionDocument,
  type StoredSessionDocument,
} from "./markup/session-document";

const { workspaces, projects, markupSessions } = schema;

function findWorkspaceByNameImpl(name: string) {
  return getDb()
    .select()
    .from(workspaces)
    .where(eq(workspaces.name, name))
    .get();
}

export const findWorkspaceByName = cache(findWorkspaceByNameImpl);

export function createWorkspace(name: string) {
  const id = randomUUID();
  getDb().insert(workspaces).values({ id, name }).run();
  return findWorkspaceByName(name)!;
}

function findProjectImpl(workspaceName: string, projectName: string) {
  const ws = findWorkspaceByName(workspaceName);
  if (!ws) return null;
  return getDb()
    .select()
    .from(projects)
    .where(and(eq(projects.workspaceId, ws.id), eq(projects.name, projectName)))
    .get();
}

export const findProject = cache(findProjectImpl);

export function createProject(workspaceName: string, projectName: string) {
  const ws = findWorkspaceByName(workspaceName);
  if (!ws) throw new Error("Workspace not found");
  const id = randomUUID();
  getDb().insert(projects).values({ id, workspaceId: ws.id, name: projectName }).run();
  return findProject(workspaceName, projectName)!;
}

function listSessionsImpl(workspaceName: string, projectName: string) {
  const project = findProject(workspaceName, projectName);
  if (!project) return [];
  return getDb()
    .select()
    .from(markupSessions)
    .where(eq(markupSessions.projectId, project.id))
    .orderBy(desc(markupSessions.createdAt))
    .all();
}

export const listSessions = cache(listSessionsImpl);

function findSessionImpl(
  workspaceName: string,
  projectName: string,
  sessionId: string,
) {
  const project = findProject(workspaceName, projectName);
  if (!project) return null;
  return getDb()
    .select()
    .from(markupSessions)
    .where(
      and(
        eq(markupSessions.projectId, project.id),
        eq(markupSessions.id, sessionId),
      ),
    )
    .get();
}

export const findSession = cache(findSessionImpl);

export function createSession(
  workspaceName: string,
  projectName: string,
  title: string,
  image?: {
    path: string;
    mime: string;
    width: number;
    height: number;
    thumbnailPath: string;
  },
  options?: {
    sessionId?: string;
    frameSize?: { width: number; height: number };
  },
) {
  const project = findProject(workspaceName, projectName);
  if (!project) throw new Error("Project not found");
  const sessionId = options?.sessionId ?? randomUUID();
  const now = new Date();
  const document = image
    ? createInitialSessionDocument(title, {
        id: randomUUID(),
        path: image.path,
        mime: image.mime,
        width: image.width,
        height: image.height,
      })
    : createBlankInitialSessionDocument(title, options?.frameSize);
  getDb()
    .insert(markupSessions)
    .values({
      id: sessionId,
      projectId: project.id,
      title,
      document,
      thumbnailPath: image?.thumbnailPath ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return findSession(workspaceName, projectName, sessionId)!;
}

function deleteDocumentUploads(document: StoredSessionDocument) {
  for (const path of imagePathsInDocument(document)) {
    deleteSessionUploadDir(path);
  }
}

export function deleteProject(workspaceName: string, projectName: string) {
  const project = findProject(workspaceName, projectName);
  if (!project) return false;
  const sessions = getDb()
    .select()
    .from(markupSessions)
    .where(eq(markupSessions.projectId, project.id))
    .all();
  for (const session of sessions) {
    deleteDocumentUploads(requireSessionDocument(session.document));
  }
  getDb().delete(markupSessions).where(eq(markupSessions.projectId, project.id)).run();
  getDb().delete(projects).where(eq(projects.id, project.id)).run();
  return true;
}

export function updateSessionTitle(
  workspaceName: string,
  projectName: string,
  sessionId: string,
  title: string,
) {
  const session = findSession(workspaceName, projectName, sessionId);
  if (!session) return null;
  const updatedAt = new Date();
  getDb()
    .update(markupSessions)
    .set({ title, updatedAt })
    .where(eq(markupSessions.id, sessionId))
    .run();
  return { ...session, title, updatedAt };
}

export function saveSessionEditorState(
  workspaceName: string,
  projectName: string,
  sessionId: string,
  data: {
    document: StoredSessionDocument;
  },
) {
  const session = findSession(workspaceName, projectName, sessionId);
  if (!session) return null;
  const updatedAt = new Date();
  const existing = requireSessionDocument(session.document);
  const mergedDocument = {
    ...data.document,
    images:
      Object.keys(data.document.images).length > 0
        ? { ...existing.images, ...data.document.images }
        : existing.images,
  };
  getDb()
    .update(markupSessions)
    .set({ document: mergedDocument, updatedAt })
    .where(eq(markupSessions.id, sessionId))
    .run();
  return { ...session, document: mergedDocument, updatedAt };
}

export function sessionDocument(session: { document: StoredSessionDocument }) {
  return requireSessionDocument(session.document);
}

export function findSessionImageAsset(
  workspaceName: string,
  projectName: string,
  sessionId: string,
  imageId: string,
) {
  const session = findSession(workspaceName, projectName, sessionId);
  if (!session) return null;
  const document = sessionDocument(session);
  return document.images[imageId] ?? null;
}

export function deleteSession(
  workspaceName: string,
  projectName: string,
  sessionId: string,
) {
  const session = findSession(workspaceName, projectName, sessionId);
  if (!session) return false;
  getDb().delete(markupSessions).where(eq(markupSessions.id, sessionId)).run();
  return true;
}

export function replaceSessionBaseImage(
  workspaceName: string,
  projectName: string,
  sessionId: string,
  image: {
    path: string;
    mime: string;
    width: number;
    height: number;
    thumbnailPath: string;
  },
  options: { keepMarkup: boolean },
) {
  const session = findSession(workspaceName, projectName, sessionId);
  if (!session) return null;
  const updatedAt = new Date();
  const existing = sessionDocument(session);
  const activeId = existing.activeArtboardId ?? existing.artboards[0]?.id;
  const active = existing.artboards.find((a) => a.id === activeId);
  const oldPath = active?.imageId ? existing.images[active.imageId]?.path : null;
  const mergedDocument = mergeReplacedBaseImage(existing, image, options);
  if (oldPath && oldPath !== image.path) {
    deleteSessionUploadDir(oldPath);
  }
  const patch = {
    thumbnailPath: image.thumbnailPath,
    document: mergedDocument,
    updatedAt,
  };
  getDb()
    .update(markupSessions)
    .set(patch)
    .where(eq(markupSessions.id, sessionId))
    .run();
  return { ...session, ...patch };
}
