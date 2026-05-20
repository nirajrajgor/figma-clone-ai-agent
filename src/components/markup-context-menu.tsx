"use client";

import type { ReactNode } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { formatModKey, formatShiftModKey } from "@/lib/keyboard-shortcuts";
import { cn } from "@/lib/utils";

export type MarkupContextMenuActions = {
  canCopy: boolean;
  canPaste: boolean;
  canDuplicate: boolean;
  canGroup: boolean;
  canUngroup: boolean;
  canEditText: boolean;
  canLayerOrder: boolean;
  canDelete: boolean;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onEditText: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onDelete: () => void;
};

type MarkupContextMenuProps = {
  children: ReactNode;
  actions: MarkupContextMenuActions;
  onContextMenu?: (e: React.MouseEvent) => void;
  className?: string;
  triggerClassName?: string;
  triggerRef?: React.Ref<HTMLDivElement>;
  "data-testid"?: string;
} & Omit<React.ComponentProps<typeof ContextMenuTrigger>, "children">;

export function MarkupContextMenu({
  children,
  actions,
  onContextMenu,
  className,
  triggerClassName,
  triggerRef,
  "data-testid": testId,
  ...triggerProps
}: MarkupContextMenuProps) {
  const {
    canCopy,
    canPaste,
    canDuplicate,
    canGroup,
    canUngroup,
    canEditText,
    canLayerOrder,
    canDelete,
    onCopy,
    onPaste,
    onDuplicate,
    onGroup,
    onUngroup,
    onEditText,
    onBringForward,
    onSendBackward,
    onDelete,
  } = actions;

  return (
    <ContextMenu>
      <ContextMenuTrigger
        ref={triggerRef}
        data-testid={testId}
        className={cn(triggerClassName)}
        onContextMenu={onContextMenu}
        {...triggerProps}
      >
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className={className}>
        <ContextMenuItem
          disabled={!canCopy}
          data-testid="context-menu-copy"
          onClick={onCopy}
        >
          Copy
          <ContextMenuShortcut>{formatModKey("C")}</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!canPaste}
          data-testid="context-menu-paste"
          onClick={onPaste}
        >
          Paste
          <ContextMenuShortcut>{formatModKey("V")}</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!canDuplicate}
          data-testid="context-menu-duplicate"
          onClick={onDuplicate}
        >
          Duplicate
          <ContextMenuShortcut>{formatModKey("D")}</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          disabled={!canGroup}
          data-testid="context-menu-group"
          onClick={onGroup}
        >
          Group
          <ContextMenuShortcut>{formatModKey("G")}</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!canUngroup}
          data-testid="context-menu-ungroup"
          onClick={onUngroup}
        >
          Ungroup
          <ContextMenuShortcut>{formatShiftModKey("G")}</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled={!canLayerOrder} onClick={onBringForward}>
          Bring forward
          <ContextMenuShortcut>{formatModKey("]")}</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem disabled={!canLayerOrder} onClick={onSendBackward}>
          Send backward
          <ContextMenuShortcut>{formatModKey("[")}</ContextMenuShortcut>
        </ContextMenuItem>
        {canEditText ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem data-testid="context-menu-edit-text" onClick={onEditText}>
              Edit text
            </ContextMenuItem>
          </>
        ) : null}
        <ContextMenuSeparator />
        <ContextMenuItem
          disabled={!canDelete}
          variant="destructive"
          data-testid="context-menu-delete"
          onClick={onDelete}
        >
          Delete
          <ContextMenuShortcut>Delete</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
