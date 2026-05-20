# 005 — View-only canvas (base image + viewport)

**Type:** AFK  
**Status:** Open  
**Triage:** ready-for-agent  
**Blocked by:** #004

## Parent

[PRD v1: Team Image Annotation](../PRD-v1-image-annotation.md)

## What to build

**Markup session** editor route loads **base image** and empty **markup stack**. **Canvas viewport**: fit image on open, pan and zoom. Markup layer uses image coordinates (ready for objects in #006). Base image is not selectable.

## Acceptance criteria

- [ ] Session route loads base image from server (US 13)
- [ ] Image fits viewport on open (US 22)
- [ ] Pan and zoom work (US 23)
- [ ] Any future markup stays aligned with image when panning/zooming (US 24)
- [ ] Base image cannot be selected as a markup object (US 18)

## Blocked by

- #004 — Markup session list and create

## User stories

13, 18, 22, 23, 24
