# 032 — Create dialog: preset + optional image

**Type:** AFK  
**Status:** Ready  
**Triage:** ready-for-agent  
**Blocked by:** [030](./030-device-presets.md), [031](./031-blank-design-file-api.md)  
**Parallel wave:** 2

## Parent

[README v4](./README-v4.md)

## What to build

Update **new design file** flow in `session-create-dialog.tsx`:

1. **Device preset** selector (Phone / Tablet / Desktop), default Phone.
2. **Image optional** — remove “Image required”; allow submit with title + preset only.
3. Copy aligned with [033](./033-design-file-ui-copy.md) if merged (“New design file”, “Design file title”); if 033 not merged, use those strings here anyway.
4. Submit: `FormData` with `title`, `preset`, and `image` only when provided.

Empty project CTA on `project-view.tsx` may reference “New design file” — only if not owned by 033.

## Acceptance criteria

- [ ] Create with preset only opens editor with correct frame dimensions
- [ ] Create with preset + image still works
- [ ] Validation error only when title empty
- [ ] `data-testid`s: `create-design-file-form`, `device-preset-select`, `create-design-file-submit` (add or keep stable ids documented in E2E helpers)

## User stories covered

- As a **Designer**, I want to pick a device size when creating a file, so that the first frame matches my target screen.

## Do not edit

`annotation-editor.tsx` (except imports if unavoidable), `repository.ts` unless fixing a bug found in integration
