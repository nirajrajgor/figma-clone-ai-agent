"use client";

import { useEditorSidebar } from "@/components/editor-sidebar-context";
import { MarkupLayersPanel } from "@/components/markup-layers-panel";
import { SessionsSidebar } from "@/components/sessions-sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { SessionRow } from "@/lib/session-types";

type Props = {
  workspace: string;
  project: string;
  sessions: SessionRow[];
  activeSessionId?: string;
  onNewSession: () => void;
};

export function EditorLeftSidebar({
  workspace,
  project,
  sessions,
  activeSessionId,
  onNewSession,
}: Props) {
  const { layers } = useEditorSidebar();

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="editor-left-sidebar">
      <SessionsSidebar
        workspace={workspace}
        project={project}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewSession={onNewSession}
        splitLayout
      />
      <Separator />
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-2">
          <MarkupLayersPanel
            artboards={layers?.artboards ?? []}
            activeArtboardId={layers?.activeArtboardId ?? ""}
            selected={layers?.selectedIds ?? new Set()}
            frameSelected={layers?.frameSelected ?? false}
            imageSelected={layers?.imageSelected ?? false}
            onSelectFrame={layers?.onSelectFrame ?? (() => {})}
            onSelectImage={layers?.onSelectImage ?? (() => {})}
            onSelectLayer={layers?.onSelectLayer ?? (() => {})}
            onLayerContextMenu={layers?.onLayerContextMenu ?? (() => {})}
            contextMenuActions={
              layers?.contextMenuActions ?? {
                canCopy: false,
                canPaste: false,
                canDuplicate: false,
                canGroup: false,
                canUngroup: false,
                canEditText: false,
                canLayerOrder: false,
                canDelete: false,
                onCopy: () => {},
                onPaste: () => {},
                onDuplicate: () => {},
                onGroup: () => {},
                onUngroup: () => {},
                onEditText: () => {},
                onBringForward: () => {},
                onSendBackward: () => {},
                onDelete: () => {},
              }
            }
          />
        </div>
      </ScrollArea>
    </div>
  );
}
