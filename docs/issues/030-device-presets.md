# 030 — Device preset constants

**Type:** AFK  
**Status:** Ready  
**Triage:** ready-for-agent  
**Blocked by:** None — can start immediately  
**Parallel wave:** 1

## Parent

[README v4](./README-v4.md) · [PRD v4](../PRD-v4-screen-design-pivot.md)

## What to build

Add a small, testable module defining **device presets** from CONTEXT / PRD v4:

| Id | Label | Category | Width | Height |
|----|-------|----------|-------|--------|
| `phone` | Phone | phone | 390 | 844 |
| `tablet` | Tablet | tablet | 768 | 1024 |
| `desktop` | Desktop | desktop | 1440 | 900 |

Export:

- `DEVICE_PRESETS` (readonly array)
- `getDevicePreset(id)` → preset or undefined
- `devicePresetSize(id)` → `{ width, height }` for artboard creation

No UI in this slice.

## Acceptance criteria

- [ ] Module lives at `src/lib/markup/device-presets.ts`
- [ ] Vitest covers all three presets and unknown id
- [ ] No changes to API or editor UI

## User stories covered

- As a **Designer**, I want standard phone/tablet/desktop frame sizes, so that I do not look up pixel dimensions.

## Do not edit

`session-create-dialog.tsx`, `annotation-editor.tsx`, `repository.ts`
