function encodeSegment(value: string) {
  return encodeURIComponent(value);
}

export function decodeSegment(value: string) {
  return decodeURIComponent(value);
}

export function projectPath(workspace: string, project: string) {
  return `/${encodeSegment(workspace)}/${encodeSegment(project)}`;
}

export function sessionPath(workspace: string, project: string, sessionId: string) {
  return `${projectPath(workspace, project)}/sessions/${sessionId}`;
}

export function apiWorkspacePath(workspace: string) {
  return `/api/workspaces/${encodeSegment(workspace)}`;
}

export function apiProjectsPath(workspace: string) {
  return `${apiWorkspacePath(workspace)}/projects`;
}

export function apiProjectPath(workspace: string, project: string) {
  return `${apiProjectsPath(workspace)}/${encodeSegment(project)}`;
}

export function apiSessionsPath(workspace: string, project: string) {
  return `${apiProjectPath(workspace, project)}/sessions`;
}

export function apiSessionPath(workspace: string, project: string, sessionId: string) {
  return `${apiSessionsPath(workspace, project)}/${sessionId}`;
}

export function apiSessionImagePath(
  workspace: string,
  project: string,
  sessionId: string,
  imageId: string,
) {
  return `${apiSessionPath(workspace, project, sessionId)}/image/${imageId}`;
}

export function apiSessionThumbnailPath(workspace: string, project: string, sessionId: string) {
  return `${apiSessionPath(workspace, project, sessionId)}/thumbnail`;
}

export function apiSessionExportPath(workspace: string, project: string, sessionId: string) {
  return `${apiSessionPath(workspace, project, sessionId)}/export`;
}

export function apiSessionBaseImagePath(workspace: string, project: string, sessionId: string) {
  return `${apiSessionPath(workspace, project, sessionId)}/base-image`;
}
