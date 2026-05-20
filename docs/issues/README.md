# Local issues (v1)

Tracked in-repo until GitHub is set up. Copy bodies to `gh issue create` later.

| # | Title | Type | Status | Blocked by |
|---|--------|------|--------|------------|
| [001](./001-implementation-stack.md) | Implementation stack (Next.js + SQLite) | HITL | **Done** | — |
| [002](./002-instance-shell.md) | Runnable team instance shell | AFK | **Done** | 001 |
| [003](./003-workspace-project-entry.md) | Workspace and project entry flow | AFK | **Done** | 002 |
| [004](./004-session-list-and-create.md) | Markup session list and create | AFK | **Done** | 003 |
| [005](./005-view-only-canvas.md) | View-only canvas (base image + viewport) | AFK | **Done** | 004 |
| [006](./006-rectangle-tool-persist.md) | Rectangle tool with persisted markup stack | AFK | **Done** | 005 |
| [007](./007-arrow-freehand-tools.md) | Arrow and freehand tools | AFK | **Done** | 006 |
| [008](./008-text-markup-tool.md) | Text markup tool | AFK | **Done** | 006 |
| [009](./009-selection-z-order.md) | Selection, move, delete, and z-order | AFK | **Done** | 006 |
| [010](./010-undo-redo.md) | Undo and redo (local editor) | AFK | **Done** | 009 |
| [011](./011-export-png.md) | Export full-canvas PNG | AFK | **Done** | 007, 008 |
| [012](./012-session-maintenance.md) | Session maintenance | AFK | **Done** | 005 |
| [013](./013-project-deletion.md) | Project deletion with confirmation | AFK | **Done** | 003 |

**Triage label (when on GitHub):** `ready-for-agent`

**Parent:** [PRD v1](../PRD-v1-image-annotation.md)

**E2E:** Each slice adds Playwright specs under `e2e/`; run headful with `npm run e2e`. See [E2E.md](./E2E.md).
