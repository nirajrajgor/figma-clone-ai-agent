# 038 — Markup context menu (canvas + layers)

**Type:** AFK  
**Status:** Done  
**Triage:** ready-for-agent  
**Blocked by:** [018](./018-duplicate-copy-paste.md), [022](./022-layers-panel.md)

## Parent

[PRD v2: Richer markup and polish](../PRD-v2-markup-and-polish.md)

## What to build

Right-click context menu on the **canvas viewport** and **layers panel** rows (shadcn `ContextMenu`), mirroring common markup actions already available via keyboard or toolbar.

## Menu actions

| Action | Shortcut shown | Notes |
|--------|----------------|--------|
| Copy | `Cmd/Ctrl+C` | Selection or object under cursor |
| Paste | `Cmd/Ctrl+V` | Same session clipboard |
| Duplicate | `Cmd/Ctrl+D` | Offset copy |
| Bring forward | — | Z-order |
| Send backward | — | Z-order |
| Edit text | — | Single text layer only |
| Delete | — | Destructive styling |

## Acceptance criteria

- [x] Canvas right-click selects hit object (if any) and opens menu
- [x] Layers row right-click selects layer and opens same menu
- [x] Copy, paste, duplicate, layer order, delete wired to existing document ops
- [x] Edit text opens inline editor for one selected text object
- [x] E2E: `e2e/markup-context-menu.spec.ts`

## Stable selectors

| `data-testid` | Element |
|---------------|---------|
| `context-menu-copy` | Copy item |
| `context-menu-paste` | Paste item |
| `context-menu-duplicate` | Duplicate item |
| `context-menu-edit-text` | Edit text item (when visible) |
| `context-menu-delete` | Delete item |

## Implementation

- `src/components/markup-context-menu.tsx`
- `src/components/ui/context-menu.tsx` (shadcn)
- `src/components/annotation-editor.tsx` — canvas trigger + action wiring
- `src/components/markup-layers-panel.tsx` — per-layer trigger
