"use client";

import dynamic from "next/dynamic";
import { PanelLeft, PanelRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ActionTooltip } from "@/components/action-tooltip";
import { AppNavbar, sessionCrumbs } from "@/components/app-navbar";
import { AppShell } from "@/components/app-shell";
import { EditorLeftSidebar } from "@/components/editor-left-sidebar";
import { EditorSidebarProvider } from "@/components/editor-sidebar-context";
import { SessionCreateDialog } from "@/components/session-create-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  apiSessionBaseImagePath,
  apiSessionExportPath,
  apiSessionPath,
  projectPath,
} from "@/lib/paths";
import { fetchProjectSessions } from "@/lib/api-client";
import { imageDimensionsMatch } from "@/lib/markup/replace-base-image";
import { getActiveArtboard } from "@/lib/markup/session-document";
import type { ClientSessionDocument } from "@/lib/markup/session-document";
import { readFileImageDimensions } from "@/lib/read-image-dimensions";
import type { SessionRow } from "@/lib/session-types";
import { isTypingTarget } from "@/lib/utils";

const AnnotationEditor = dynamic(
  () =>
    import("@/components/annotation-editor").then((mod) => ({
      default: mod.AnnotationEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-full min-h-[320px] items-center justify-center bg-muted/30"
        data-testid="annotation-editor-loading"
      >
        <div className="h-10 w-10 animate-pulse rounded-full bg-muted" aria-hidden />
      </div>
    ),
  },
);

type SessionData = {
  id: string;
  title: string;
  document: ClientSessionDocument;
};

type Props = {
  workspace: string;
  project: string;
  sessionId: string;
  initialSession: SessionData;
  initialSessions: SessionRow[];
};

export function SessionEditor({
  workspace,
  project,
  sessionId,
  initialSession,
  initialSessions,
}: Props) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [sessions, setSessions] = useState(initialSessions);
  const [title, setTitle] = useState(initialSession.title);
  const [canvasKey, setCanvasKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [pendingReplaceFile, setPendingReplaceFile] = useState<File | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const apiBase = apiSessionPath(workspace, project, sessionId);

  const loadSessions = useCallback(async () => {
    setSessions(
      (await fetchProjectSessions(workspace, project, { fresh: true })) as SessionRow[],
    );
  }, [workspace, project]);

  const reloadSession = useCallback(async () => {
    const res = await fetch(apiBase);
    if (!res.ok) return;
    const data = (await res.json()) as SessionData;
    setSession(data);
    setTitle(data.title);
    void loadSessions();
  }, [apiBase, loadSessions]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "\\" && e.shiftKey && !isTypingTarget(e.target)) {
        e.preventDefault();
        setSidebarOpen((open) => !open);
        setInspectorOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function saveTitle() {
    const trimmed = title.trim();
    if (!trimmed || !session) return;
    const res = await fetch(apiBase, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
    if (res.ok) {
      setSession({ ...session, title: trimmed });
      void loadSessions();
    }
  }

  async function confirmDeleteSession() {
    await fetch(apiBase, { method: "DELETE" });
    setDeleteOpen(false);
    router.push(projectPath(workspace, project));
  }

  async function replaceBaseImage(file: File, keepMarkup: boolean) {
    const body = new FormData();
    body.set("image", file);
    body.set("keepMarkup", keepMarkup ? "true" : "false");
    const res = await fetch(apiSessionBaseImagePath(workspace, project, sessionId), {
      method: "PUT",
      body,
    });
    if (res.ok) {
      await reloadSession();
      setCanvasKey((k) => k + 1);
    }
  }

  async function confirmReplaceBaseImage(keepMarkup: boolean) {
    if (!pendingReplaceFile) return;
    await replaceBaseImage(pendingReplaceFile, keepMarkup);
    setReplaceOpen(false);
    setPendingReplaceFile(null);
  }

  async function handleReplaceImage(file: File) {
    const active = getActiveArtboard(session.document);
    const currentImage = active?.imageId
      ? session.document.images[active.imageId]
      : null;
    if (!currentImage) {
      await replaceBaseImage(file, false);
      return;
    }
    try {
      const nextDimensions = await readFileImageDimensions(file);
      if (imageDimensionsMatch(currentImage, nextDimensions)) {
        await replaceBaseImage(file, true);
        return;
      }
    } catch {
      // Fall through to confirmation when dimensions cannot be read.
    }
    setPendingReplaceFile(file);
    setReplaceOpen(true);
  }

  const panelToggles = (
    <>
      <ActionTooltip
        label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          data-testid="toggle-sidebar"
          aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          aria-pressed={sidebarOpen}
          onClick={() => setSidebarOpen((open) => !open)}
        >
          <PanelLeft className="size-4" />
        </Button>
      </ActionTooltip>
      <ActionTooltip
        label={inspectorOpen ? "Hide properties panel" : "Show properties panel"}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          data-testid="toggle-inspector"
          aria-label={inspectorOpen ? "Hide inspector" : "Show inspector"}
          aria-pressed={inspectorOpen}
          onClick={() => setInspectorOpen((open) => !open)}
        >
          <PanelRight className="size-4" />
        </Button>
      </ActionTooltip>
    </>
  );

  const crumbs = sessionCrumbs(workspace, project, title, {
    editValue: title,
    onEditChange: setTitle,
    onEditCommit: saveTitle,
  });

  return (
    <>
      <EditorSidebarProvider>
      <AppShell
        className="h-svh"
        sidebarCollapsed={!sidebarOpen}
        navbar={
          <AppNavbar
            crumbs={crumbs}
            exportHref={apiSessionExportPath(workspace, project, sessionId)}
            trailing={panelToggles}
          />
        }
        sidebar={
          <EditorLeftSidebar
            workspace={workspace}
            project={project}
            sessions={sessions}
            activeSessionId={sessionId}
            onNewSession={() => setCreateOpen(true)}
          />
        }
      >
        <div className="h-full" data-testid="session-editor">
          <AnnotationEditor
            key={canvasKey}
            workspace={workspace}
            project={project}
            sessionId={sessionId}
            title={title}
            initialDocument={session.document}
            inspectorOpen={inspectorOpen}
            sessionActions={{
              onReplaceImage: (file) => {
                void handleReplaceImage(file);
              },
              onDeleteSession: () => setDeleteOpen(true),
            }}
          />
        </div>
      </AppShell>
      </EditorSidebarProvider>

      <SessionCreateDialog
        workspace={workspace}
        project={project}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={loadSessions}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete session?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the session, base image, and all markup.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="delete-session-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              data-testid="delete-session-confirm"
              onClick={() => void confirmDeleteSession()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={replaceOpen}
        onOpenChange={(open) => {
          setReplaceOpen(open);
          if (!open) setPendingReplaceFile(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace base image?</AlertDialogTitle>
            <AlertDialogDescription>
              The replacement image has different dimensions. Keep existing markup (it may
              misalign) or clear all markup and reset the artboard layout.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="replace-base-image-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="replace-base-image-keep-markup"
              onClick={() => void confirmReplaceBaseImage(true)}
            >
              Keep markup
            </AlertDialogAction>
            <AlertDialogAction
              data-testid="replace-base-image-clear-markup"
              onClick={() => void confirmReplaceBaseImage(false)}
            >
              Clear markup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
