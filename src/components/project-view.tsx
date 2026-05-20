"use client";

import { Images, PanelLeft } from "lucide-react";
import { useCallback, useState } from "react";
import { ActionTooltip } from "@/components/action-tooltip";
import { AppNavbar, projectCrumbs } from "@/components/app-navbar";
import { AppShell } from "@/components/app-shell";
import { ProjectMenu } from "@/components/project-menu";
import { SessionCreateDialog } from "@/components/session-create-dialog";
import { SessionsSidebar } from "@/components/sessions-sidebar";
import type { SessionRow } from "@/lib/session-types";
import { Button } from "@/components/ui/button";
import { fetchProjectSessions } from "@/lib/api-client";

type Props = {
  workspace: string;
  project: string;
  initialSessions: SessionRow[];
};

export function ProjectView({ workspace, project, initialSessions }: Props) {
  const [sessions, setSessions] = useState(initialSessions);
  const [createOpen, setCreateOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const load = useCallback(async () => {
    setSessions(
      (await fetchProjectSessions(workspace, project, { fresh: true })) as SessionRow[],
    );
  }, [workspace, project]);

  const crumbs = projectCrumbs(workspace, project).map((c, i) =>
    i === 1 ? { ...c, testId: "project-breadcrumb" } : c,
  );

  return (
    <>
      <AppShell
        sidebarCollapsed={!sidebarOpen}
        navbar={
          <AppNavbar
            crumbs={crumbs}
            trailing={
              <>
                <ActionTooltip
                  label={sidebarOpen ? "Hide design files panel" : "Show design files panel"}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    data-testid="toggle-sidebar"
                    aria-label={sidebarOpen ? "Hide design files panel" : "Show design files panel"}
                    aria-pressed={sidebarOpen}
                    onClick={() => setSidebarOpen((open) => !open)}
                  >
                    <PanelLeft className="size-4" />
                  </Button>
                </ActionTooltip>
                <ProjectMenu workspace={workspace} project={project} />
              </>
            }
          />
        }
        sidebar={
          <SessionsSidebar
            workspace={workspace}
            project={project}
            sessions={sessions}
            onNewSession={() => setCreateOpen(true)}
          />
        }
      >
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
          {sessions.length === 0 ? (
            <>
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted">
                <Images className="size-7 text-muted-foreground" aria-hidden />
              </div>
              <h1 className="text-lg font-semibold">No design files yet</h1>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Create a design file with device frames, shapes, and text—or add an image layer when
                you need one.
              </p>
              <Button
                type="button"
                className="mt-6"
                data-testid="create-session-empty"
                onClick={() => setCreateOpen(true)}
              >
                New design file
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-lg font-semibold">Select a design file</h1>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Choose a design file from the sidebar to open the canvas, or create a new one.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-6"
                data-testid="create-session-empty"
                onClick={() => setCreateOpen(true)}
              >
                New design file
              </Button>
            </>
          )}
        </div>
      </AppShell>

      <SessionCreateDialog
        workspace={workspace}
        project={project}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={load}
      />
    </>
  );
}
