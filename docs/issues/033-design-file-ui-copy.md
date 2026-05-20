# 033 — UI copy: design file / Designer

**Type:** AFK  
**Status:** Ready  
**Triage:** ready-for-agent  
**Blocked by:** None — can start immediately  
**Parallel wave:** 1

## Parent

[README v4](./README-v4.md) · [CONTEXT.md](../../CONTEXT.md)

## What to build

User-visible copy pivot (no route renames, no API changes):

| Legacy | Prefer |
|--------|--------|
| Markup session | Design file |
| Session (list labels) | Design file |
| New markup session | New design file |
| Session title | Design file title |
| Base image (labels) | Image (or Image layer) |
| Annotator-facing strings | Designer where it means the role |

Touch: `sessions-sidebar.tsx`, `project-view.tsx`, `session-editor.tsx` (navbar crumbs only if needed), `annotation-inspector.tsx` labels, `README.md` one-line status, empty states.

**Do not change** `session-create-dialog.tsx` (owned by 032) or toolbar tool order (037).

## Acceptance criteria

- [ ] No user-facing “markup session” in touched files
- [ ] Grep `markup session` in `src/` (excluding tests/comments) returns zero or only deferred routes
- [ ] No functional behavior changes

## User stories covered

- As a **Designer**, I see language that matches a screen design tool, not a screenshot annotator.

## Do not edit

`session-create-dialog.tsx`, `annotation-editor.tsx` (toolbar), `annotation-tools.tsx`
