import { apiSessionsPath } from "@/lib/paths";

const inflight = new Map<string, Promise<unknown[]>>();
const cache = new Map<string, { data: unknown[]; expires: number }>();
const CACHE_TTL_MS = 3000;

function cacheKey(workspace: string, project: string) {
  return `${workspace}\0${project}`;
}

export function invalidateProjectSessions(workspace: string, project: string) {
  cache.delete(cacheKey(workspace, project));
}

export async function fetchProjectSessions(
  workspace: string,
  project: string,
  options?: { fresh?: boolean },
) {
  const key = cacheKey(workspace, project);
  if (options?.fresh) cache.delete(key);
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.data;

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const res = await fetch(apiSessionsPath(workspace, project));
      if (!res.ok) return [];
      const data = (await res.json()) as { sessions: unknown[] };
      const sessions = data.sessions;
      cache.set(key, { data: sessions, expires: Date.now() + CACHE_TTL_MS });
      return sessions;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}
