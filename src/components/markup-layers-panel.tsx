"use client";

import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Circle,
  Folder,
  Frame,
  Image as ImageIcon,
  Minus,
  MousePointer2,
  Pencil,
  Square,
  SquareSlash,
  Type,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ArtboardLayersNode } from "@/components/editor-sidebar-context";
import {
  MarkupContextMenu,
  type MarkupContextMenuActions,
} from "@/components/markup-context-menu";
import { buildLayerTree, directGroupChildren, type LayerTreeNode } from "@/lib/markup/groups";
import { sortByZIndex } from "@/lib/markup/document";
import type { MarkupObject } from "@/lib/markup/types";
import { cn } from "@/lib/utils";

function layerLabel(obj: MarkupObject): string {
  switch (obj.type) {
    case "group":
      return obj.name.trim() || "Group";
    case "text":
      return obj.content.trim() || "Text";
    case "rectangle":
      return "Rectangle";
    case "ellipse":
      return "Ellipse";
    case "arrow":
      return "Arrow";
    case "line":
      return "Line";
    case "freehand":
      return "Draw";
    case "redact":
      return "Redact";
    default:
      return "Layer";
  }
}

function layerIcon(obj: MarkupObject) {
  const className = "size-3.5 shrink-0 text-muted-foreground";
  switch (obj.type) {
    case "group":
      return <Folder className={className} aria-hidden />;
    case "rectangle":
      return <Square className={className} aria-hidden />;
    case "ellipse":
      return <Circle className={className} aria-hidden />;
    case "arrow":
      return <ArrowRight className={className} aria-hidden />;
    case "line":
      return <Minus className={className} aria-hidden />;
    case "freehand":
      return <Pencil className={className} aria-hidden />;
    case "text":
      return <Type className={className} aria-hidden />;
    case "redact":
      return <SquareSlash className={className} aria-hidden />;
    default:
      return <MousePointer2 className={className} aria-hidden />;
  }
}

const rowClass = (active: boolean) =>
  cn(
    "flex w-full min-w-0 items-center gap-1.5 rounded-md py-1.5 text-left text-sm transition-colors",
    active
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-foreground hover:bg-sidebar-accent/60",
  );

type Props = {
  artboards: ArtboardLayersNode[];
  activeArtboardId: string;
  selected: Set<string>;
  frameSelected: boolean;
  imageSelected: boolean;
  onSelectFrame: (artboardId: string) => void;
  onSelectImage: (artboardId: string) => void;
  onSelectLayer: (id: string, additive: boolean) => void;
  onLayerContextMenu: (id: string) => void;
  contextMenuActions: MarkupContextMenuActions;
};

function isRowSelected(selected: Set<string>, obj: MarkupObject): boolean {
  return selected.has(obj.id);
}

export function MarkupLayersPanel({
  artboards,
  activeArtboardId,
  selected,
  frameSelected,
  imageSelected,
  onSelectFrame,
  onSelectImage,
  onSelectLayer,
  onLayerContextMenu,
  contextMenuActions,
}: Props) {
  const [expandedArtboards, setExpandedArtboards] = useState<Set<string>>(() => new Set([activeArtboardId]));
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setExpandedArtboards((prev) => {
      if (prev.has(activeArtboardId)) return prev;
      const next = new Set(prev);
      next.add(activeArtboardId);
      return next;
    });
  }, [activeArtboardId]);

  const toggleArtboard = (artboardId: string) => {
    setExpandedArtboards((prev) => {
      const next = new Set(prev);
      if (next.has(artboardId)) next.delete(artboardId);
      else next.add(artboardId);
      return next;
    });
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const inactiveActions: MarkupContextMenuActions = {
    ...contextMenuActions,
    canCopy: false,
    canDuplicate: false,
    canGroup: false,
    canUngroup: false,
    canEditText: false,
    canLayerOrder: false,
    canDelete: false,
  };

  const renderLayerRow = (
    board: ArtboardLayersNode,
    obj: MarkupObject,
    opts: { testId: string; indent?: boolean },
  ) => {
    const active = board.isActive && isRowSelected(selected, obj);
    const label = layerLabel(obj);
    const actions = board.isActive ? contextMenuActions : inactiveActions;

    return (
      <MarkupContextMenu
        actions={actions}
        onContextMenu={() => {
          if (!board.isActive) onSelectFrame(board.id);
          if (!isRowSelected(selected, obj)) {
            onSelectLayer(obj.id, false);
          }
          onLayerContextMenu(obj.id);
        }}
        triggerClassName="w-full"
      >
        <button
          type="button"
          data-testid={opts.testId}
          data-layer-id={obj.id}
          data-layer-type={obj.type}
          aria-pressed={active}
          title={label}
          className={cn(rowClass(active), "w-full px-2", opts.indent && "pl-6")}
          onClick={(e) => {
            if (!board.isActive) onSelectFrame(board.id);
            onSelectLayer(obj.id, e.shiftKey);
          }}
        >
          {layerIcon(obj)}
          <span className="min-w-0 flex-1 truncate">{label}</span>
        </button>
      </MarkupContextMenu>
    );
  };

  const nestedGroupChildren = (objects: MarkupObject[], groupId: string) =>
    sortByZIndex(directGroupChildren(objects, groupId)).reverse();

  const renderTreeNode = (board: ArtboardLayersNode, node: LayerTreeNode, depth = 0): React.ReactNode => {
    if (node.kind === "leaf") {
      return (
        <li key={node.object.id}>
          {renderLayerRow(board, node.object, {
            testId: "layer-item",
            indent: depth > 0,
          })}
        </li>
      );
    }

    const { group, children } = node;
    const groupExpanded = expandedGroups.has(group.id);

    return (
      <li key={group.id} data-testid="layer-group">
        <div className="flex min-w-0 items-center" style={{ paddingLeft: depth > 0 ? depth * 12 : 0 }}>
          <button
            type="button"
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent/60"
            aria-label={groupExpanded ? "Collapse group" : "Expand group"}
            aria-expanded={groupExpanded}
            data-testid="layer-group-toggle"
            onClick={() => toggleGroup(group.id)}
          >
            {groupExpanded ? (
              <ChevronDown className="size-3.5" aria-hidden />
            ) : (
              <ChevronRight className="size-3.5" aria-hidden />
            )}
          </button>
          <div className="min-w-0 flex-1">
            {renderLayerRow(board, group, { testId: "layer-group-row" })}
          </div>
        </div>
        {groupExpanded && (
          <ul className="ml-8 space-y-0.5 border-l border-border/60 pl-1.5">
            {children.map((child) =>
              child.type === "group" ? (
                renderTreeNode(
                  board,
                  {
                    kind: "group",
                    group: child,
                    children: nestedGroupChildren(board.objects, child.id),
                  },
                  depth + 1,
                )
              ) : (
                <li key={child.id}>
                  {renderLayerRow(board, child, { testId: "layer-item", indent: true })}
                </li>
              ),
            )}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-2" data-testid="layers-panel">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Layers</p>
      {artboards.length === 0 ? (
        <p className="text-xs text-muted-foreground">No artboards yet.</p>
      ) : (
        <ul className="space-y-0.5" data-testid="layers-list">
          {artboards.map((board) => {
            const isExpanded = expandedArtboards.has(board.id);
            const frameActive =
              board.isActive && frameSelected && !imageSelected && selected.size === 0;
            const imageActive = board.isActive && imageSelected && selected.size === 0;
            const tree = buildLayerTree(board.objects);

            return (
              <li key={board.id} data-testid="layer-artboard">
                <div className="flex min-w-0 items-center">
                  <button
                    type="button"
                    className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent/60"
                    aria-label={isExpanded ? "Collapse artboard layers" : "Expand artboard layers"}
                    aria-expanded={isExpanded}
                    data-testid="layer-artboard-toggle"
                    onClick={() => toggleArtboard(board.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="size-3.5" aria-hidden />
                    ) : (
                      <ChevronRight className="size-3.5" aria-hidden />
                    )}
                  </button>
                  <button
                    type="button"
                    data-testid="layer-frame"
                    data-artboard-id={board.id}
                    aria-pressed={frameActive}
                    title={board.title}
                    className={cn(rowClass(frameActive), "min-w-0 flex-1 px-1.5")}
                    onClick={() => onSelectFrame(board.id)}
                  >
                    <Frame className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{board.title}</span>
                  </button>
                </div>
                {isExpanded && (
                  <ul className="ml-5 space-y-0.5 border-l border-border/60 pl-1.5">
                    {board.hasImage && (
                      <li>
                        <button
                          type="button"
                          data-testid="layer-image"
                          data-artboard-id={board.id}
                          aria-pressed={imageActive}
                          title="Image"
                          className={cn(rowClass(imageActive), "px-2")}
                          onClick={() => onSelectImage(board.id)}
                        >
                          <ImageIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                          <span className="min-w-0 flex-1 truncate">Image</span>
                        </button>
                      </li>
                    )}
                    {tree.map((node) => renderTreeNode(board, node))}
                    {!board.hasImage && tree.length === 0 && (
                      <li className="px-2 py-1.5 text-xs text-muted-foreground">Empty frame</li>
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
