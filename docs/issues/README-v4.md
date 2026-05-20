# Local issues (v4 — screen design pivot, phase 1)

Tracked in-repo until GitHub is set up. Copy bodies to `gh issue create` later.

**Parent:** [PRD v4 — screen design pivot](../PRD-v4-screen-design-pivot.md) · [ADR 0004](../adr/0004-screen-design-pivot.md) · [CONTEXT.md](../../CONTEXT.md)

**Triage label (when on GitHub):** `ready-for-agent`

---

## Parallel execution

Run **one issue per subagent**, each on its **own git branch**. Merge in wave order.

| Wave | Issues | Run together? | Notes |
|------|--------|---------------|--------|
| **1** | [030](./030-device-presets.md), [031](./031-blank-design-file-api.md), [033](./033-design-file-ui-copy.md) | **Yes — 3 agents** | No shared files between 030 and 033; 031 touches API/repo only |
| **2** | [032](./032-create-dialog-presets.md), [034](./034-add-frame-from-preset.md), [035](./035-export-blank-frame.md), [037](./037-review-tools-toolbar.md) | **Yes — 4 agents** after wave 1 merged | 032 needs 030+031; others need 030 only (037 needs 033 for labels) |
| **3** | [036](./036-e2e-blank-design-file.md) | **1 agent** | Integration E2E after wave 2 |

### File ownership (avoid conflicts)

| Issue | Owns (primary) | Do not edit |
|-------|----------------|-------------|
| 030 | `src/lib/markup/device-presets.ts` | — |
| 031 | `repository.ts`, `sessions/route.ts`, `session-document.ts` | `session-create-dialog.tsx` |
| 033 | Copy in `sessions-sidebar`, `project-view`, `app-navbar`, `entry-flow`, inspector labels | `session-create-dialog.tsx`, `annotation-editor.tsx` toolbar |
| 032 | `session-create-dialog.tsx`, `e2e/helpers.ts` (create helpers) | `annotation-editor.tsx` |
| 034 | `annotation-editor.tsx` (add-frame preset UI only) | `annotation-tools.tsx` |
| 035 | `lib/export/compositor.ts`, compositor tests | UI |
| 037 | `annotation-tools.tsx`, toolbar section in `annotation-editor.tsx` | `session-create-dialog.tsx` |
| 036 | `e2e/030-036-*.spec.ts` | Production code except testids |

### Subagent prompt snippet

```text
Implement docs/issues/NNN-*.md only. Branch: feat/v4-NNN-short-name.
Read CONTEXT.md and docs/PRD-v4-screen-design-pivot.md. Do not touch files listed under "Do not edit".
Run tests listed in the issue. Mark acceptance criteria in the issue when done.
```

---

| # | Title | Type | Status | Blocked by |
|---|--------|------|--------|------------|
| [030](./030-device-presets.md) | Device preset constants | AFK | **Done** | — |
| [031](./031-blank-design-file-api.md) | Create design file without image (API) | AFK | **Done** | — |
| [032](./032-create-dialog-presets.md) | Create dialog: preset + optional image | AFK | **Done** | 030, 031 |
| [033](./033-design-file-ui-copy.md) | UI copy: design file / Designer | AFK | **Done** | — |
| [034](./034-add-frame-from-preset.md) | Add device frame from preset in editor | AFK | **Done** | 030 |
| [035](./035-export-blank-frame.md) | Export blank frame (no image layer) | AFK | **Done** | — |
| [036](./036-e2e-blank-design-file.md) | E2E: blank design file + preset create | AFK | Ready | 032 |
| [037](./037-review-tools-toolbar.md) | Review tools group in toolbar | AFK | **Done** | 033 (labels) |
