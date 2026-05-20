# 034 — Add device frame from preset in editor

**Type:** AFK  
**Status:** Ready  
**Triage:** ready-for-agent  
**Blocked by:** [030](./030-device-presets.md)  
**Parallel wave:** 2 (merge 030 first)

## Parent

[README v4](./README-v4.md)

## What to build

In the session editor, let **Designers** add another **device frame** from a preset (not only freehand frame drag or default empty size).

Suggested UX (choose simplest):

- Split button or dropdown on existing **Add artboard** control: Phone / Tablet / Desktop / Custom frame (custom = current drag/frame tool behavior).

Implementation:

- Use `createEmptyArtboard(artboards, x, y, { width, height })` from `device-presets`.
- Place new frame offset from active artboard (e.g. +80px x) to avoid overlap.
- Activate new artboard after add.

## Acceptance criteria

- [ ] Adding Phone preset creates 390×844 artboard on canvas
- [ ] Multiple presets can coexist on one canvas
- [ ] Vitest or unit test for placement helper if extracted
- [ ] `data-testid`: `add-device-frame-phone` (or menu item equivalent)

## User stories covered

- As a **Designer**, I want phone and desktop frames in one file, so that I can compare layouts side by side.

## Do not edit

`session-create-dialog.tsx`, `annotation-tools.tsx`, `repository.ts`
