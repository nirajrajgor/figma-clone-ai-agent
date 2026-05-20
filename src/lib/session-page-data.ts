import { cache } from "react";
import { findSession } from "@/lib/repository";
import { toSessionRows } from "@/lib/session-presenter";

export const getSessionPageData = cache(
  (workspace: string, project: string, sessionId: string) => {
    const session = findSession(workspace, project, sessionId);
    if (!session) return null;
    return {
      session,
      sessions: toSessionRows(workspace, project),
    };
  },
);
