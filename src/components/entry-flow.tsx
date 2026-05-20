"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiProjectsPath, apiProjectPath, apiWorkspacePath, projectPath } from "@/lib/paths";
import { cn } from "@/lib/utils";

type Step = "workspace" | "project";

const STEPS: { id: Step; label: string }[] = [
  { id: "workspace", label: "Workspace" },
  { id: "project", label: "Project" },
];

const BLUR_DEBOUNCE_MS = 300;

async function readJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(
      res.ok
        ? "Empty response from server"
        : `Request failed (${res.status}). Restart the dev server if you just cleared data.`,
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid response from server (${res.status})`);
  }
}

function useDebouncedBlurCheck() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    },
    [],
  );

  return (run: (signal: AbortSignal) => Promise<void>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();
    timerRef.current = setTimeout(() => {
      const ac = new AbortController();
      abortRef.current = ac;
      void run(ac.signal).catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        throw err;
      });
    }, BLUR_DEBOUNCE_MS);
  };
}

export function EntryFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("workspace");
  const [workspace, setWorkspace] = useState("");
  const [project, setProject] = useState("");
  const [workspaceExists, setWorkspaceExists] = useState<boolean | null>(null);
  const [projectExists, setProjectExists] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scheduleBlurCheck = useDebouncedBlurCheck();

  async function checkWorkspace(name: string, signal?: AbortSignal) {
    const res = await fetch(apiWorkspacePath(name), { signal });
    const data = await readJsonResponse<{ exists: boolean }>(res);
    return data.exists;
  }

  async function checkProject(ws: string, name: string, signal?: AbortSignal) {
    const res = await fetch(apiProjectPath(ws, name), { signal });
    const data = await readJsonResponse<{ exists: boolean }>(res);
    return data.exists;
  }

  async function apiErrorMessage(res: Response, fallback: string) {
    try {
      const data = await readJsonResponse<{ error?: string }>(res);
      return data.error ?? fallback;
    } catch (err) {
      return err instanceof Error ? err.message : fallback;
    }
  }

  async function createWorkspace(name: string) {
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      throw new Error(await apiErrorMessage(res, "Could not create workspace"));
    }
    return true;
  }

  async function createProject(ws: string, name: string) {
    const res = await fetch(apiProjectsPath(ws), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      throw new Error(await apiErrorMessage(res, "Could not create project"));
    }
    return true;
  }

  async function onWorkspaceSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const name = workspace.trim();
    if (!name) {
      setError("Workspace name is required");
      return;
    }
    setLoading(true);
    let exists: boolean;
    try {
      exists = await checkWorkspace(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach server");
      setLoading(false);
      return;
    }
    if (!exists) {
      try {
        await createWorkspace(name);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create workspace");
        setLoading(false);
        return;
      }
    }
    setLoading(false);
    setStep("project");
  }

  async function onProjectSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const ws = workspace.trim();
    const name = project.trim();
    if (!name) {
      setError("Project name is required");
      return;
    }
    setLoading(true);
    let exists: boolean;
    try {
      exists = await checkProject(ws, name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach server");
      setLoading(false);
      return;
    }
    setProjectExists(exists);
    if (!exists) {
      try {
        await createProject(ws, name);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create project");
        setLoading(false);
        return;
      }
    }
    setLoading(false);
    router.push(projectPath(ws, name));
  }

  const stepIndex = step === "workspace" ? 0 : 1;

  return (
    <Card className="w-full max-w-md border shadow-sm">
      <CardHeader className="space-y-4">
        <ol className="flex items-center gap-2" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li key={s.id} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                  i <= stepIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
                aria-current={i === stepIndex ? "step" : undefined}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  i === stepIndex ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <span className="mx-1 h-px flex-1 bg-border" aria-hidden />
              )}
            </li>
          ))}
        </ol>
        <div>
          <CardTitle>
            <h1 className="text-base font-semibold">
              {step === "workspace" ? "Choose a workspace" : "Choose a project"}
            </h1>
          </CardTitle>
          <CardDescription className="mt-1.5">
            {step === "workspace"
              ? "Workspaces group your team's projects. New names are created on continue."
              : "Projects hold design files—screen layouts and shared images."}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "workspace" && (
          <form onSubmit={onWorkspaceSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-input">Workspace name</Label>
              <Input
                id="workspace-input"
                data-testid="workspace-input"
                value={workspace}
                onChange={(e) => {
                  setWorkspace(e.target.value);
                  setWorkspaceExists(null);
                  setError(null);
                }}
                onBlur={() => {
                  const name = workspace.trim();
                  if (!name) return;
                  scheduleBlurCheck(async (signal) => {
                    setWorkspaceExists(await checkWorkspace(name, signal));
                  });
                }}
                placeholder="e.g. acme-support"
                autoFocus
                disabled={loading}
              />
            </div>
            {workspaceExists === false && workspace.trim() && (
              <Alert data-testid="create-workspace-prompt">
                <AlertDescription>
                  New workspace — press Continue to create it.
                </AlertDescription>
              </Alert>
            )}
            {workspaceExists === true && workspace.trim() && (
              <Badge variant="secondary" className="font-normal">
                Existing workspace
              </Badge>
            )}
            <Button
              type="submit"
              data-testid="workspace-submit"
              className="w-full"
              disabled={loading || !workspace.trim()}
            >
              {loading ? "Please wait…" : "Continue"}
            </Button>
            <span className="sr-only" data-testid="workspace-continue" />
            <span className="sr-only" data-testid="create-workspace-confirm" />
          </form>
        )}

        {step === "project" && (
          <form onSubmit={onProjectSubmit} className="space-y-4">
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Workspace </span>
              <strong data-testid="active-workspace">{workspace.trim()}</strong>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-input">Project name</Label>
              <Input
                id="project-input"
                data-testid="project-input"
                value={project}
                onChange={(e) => {
                  setProject(e.target.value);
                  setProjectExists(null);
                  setError(null);
                }}
                onBlur={() => {
                  const name = project.trim();
                  const ws = workspace.trim();
                  if (!name || !ws) return;
                  scheduleBlurCheck(async (signal) => {
                    setProjectExists(await checkProject(ws, name, signal));
                  });
                }}
                placeholder="e.g. checkout-bug-may"
                autoFocus
                disabled={loading}
              />
            </div>
            {projectExists === false && project.trim() && (
              <Alert data-testid="create-project-prompt">
                <AlertDescription>
                  New project — press Open project to create it.
                </AlertDescription>
              </Alert>
            )}
            {projectExists === true && project.trim() && (
              <Badge variant="secondary" className="font-normal">
                Existing project
              </Badge>
            )}
            <Button
              type="submit"
              data-testid="project-submit"
              className="w-full"
              disabled={loading || !project.trim()}
            >
              {loading ? "Please wait…" : "Open project"}
            </Button>
            <span className="sr-only" data-testid="project-continue" />
            <span className="sr-only" data-testid="create-project-confirm" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                setStep("workspace");
                setError(null);
              }}
            >
              Back
            </Button>
          </form>
        )}

        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
