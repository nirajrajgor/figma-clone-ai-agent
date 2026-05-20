# 037 — Review tools group in toolbar

**Type:** AFK  
**Status:** Ready  
**Triage:** ready-for-agent  
**Blocked by:** [033](./033-design-file-ui-copy.md) (labels; can start in parallel if using neutral labels)  
**Parallel wave:** 2

## Parent

[README v4](./README-v4.md)

## What to build

Split top toolbar tools into two visual groups per CONTEXT (**design tool** vs **review tool**):

**Design:** select, frame, rectangle, ellipse, line, text  
**Review:** arrow, freehand (draw), redact  

Use a vertical `Separator` between groups. Optional tooltips: “Review — arrow”, etc. Implement via `annotation-tools.tsx` (e.g. `DESIGN_TOOLS` / `REVIEW_TOOLS` arrays) and render two `ToggleGroup`s or one group with separator in `annotation-editor.tsx`.

Do not remove tools or change shortcuts.

## Acceptance criteria

- [ ] Toolbar shows design tools then review tools with visible separator
- [ ] All tools still activatable; existing E2E tool tests pass
- [ ] `data-testid`s `tool-*` unchanged

## User stories covered

- As a **Designer**, I can tell layout tools apart from screenshot annotation tools.

## Do not edit

`session-create-dialog.tsx`, `session-document.ts`, `repository.ts`
