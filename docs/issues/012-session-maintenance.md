# 012 — Session maintenance (title, delete, replace base image)

**Type:** AFK  
**Status:** Open  
**Triage:** ready-for-agent  
**Blocked by:** #005

## Parent

[PRD v1: Team Image Annotation](../PRD-v1-image-annotation.md)

## What to build

**Session title** edit on session list or editor. **Session deletion** removes session and assets. **Replace base image**: explicit confirm, upload new PNG/JPEG/WebP, server clears entire **markup stack**.

## Acceptance criteria

- [ ] Edit session title; session id in URL unchanged (US 11)
- [ ] Delete markup session from project (US 14)
- [ ] Replace base image requires confirmation (US 19)
- [ ] Replace clears all markup objects (US 20)
- [ ] Annotator can delete session instead as alternative (US 21)

## Blocked by

- #005 — View-only canvas (base image + viewport)

## User stories

11, 14, 19, 20, 21
