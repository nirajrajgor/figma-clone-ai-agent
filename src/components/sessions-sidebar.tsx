"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileImage, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { sessionPath } from "@/lib/paths";
import type { SessionRow } from "@/lib/session-types";
import { cn } from "@/lib/utils";

type Props = {
  workspace: string;
  project: string;
  sessions: SessionRow[];
  activeSessionId?: string;
  onNewSession: () => void;
  /** Cap session list height so layers can share the left sidebar (session editor). */
  splitLayout?: boolean;
};

export function SessionsSidebar({
  workspace,
  project,
  sessions,
  activeSessionId,
  onNewSession,
  splitLayout = false,
}: Props) {
  const pathname = usePathname();

  return (
    <div
      className={
        splitLayout
          ? "flex max-h-[min(40%,14rem)] min-h-28 shrink-0 flex-col"
          : "flex h-full flex-col"
      }
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <p className="min-w-0 flex-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Design files
        </p>
        <span className="text-xs text-muted-foreground">{sessions.length}</span>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          data-testid="create-session-open"
          aria-label="New design file"
          title="New design file"
          onClick={onNewSession}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
      <Separator />
      <ScrollArea className="min-h-0 flex-1">
        <ul className="space-y-0.5 p-2" data-testid="session-list">
          {sessions.map((s) => {
            const href = sessionPath(workspace, project, s.id);
            const active = activeSessionId === s.id || pathname === href;
            return (
              <li key={s.id}>
                <Link
                  href={href}
                  data-testid="session-list-item"
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "hover:bg-sidebar-accent/60",
                  )}
                >
                  {s.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.thumbnailUrl}
                      alt=""
                      className="size-8 shrink-0 rounded object-cover"
                      data-testid="session-thumbnail"
                    />
                  ) : (
                    <div className="size-8 shrink-0 rounded bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate font-medium leading-tight"
                      data-testid="session-list-title"
                    >
                      {s.title}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {new Date(s.createdAt).toLocaleString()}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
          {sessions.length === 0 && (
            <li className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <FileImage className="size-8 text-muted-foreground/50" aria-hidden />
              <p className="text-xs text-muted-foreground">No design files yet</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-1"
                onClick={onNewSession}
              >
                New design file
              </Button>
            </li>
          )}
        </ul>
      </ScrollArea>
    </div>
  );
}
