# 011 — Export full-canvas PNG

**Type:** AFK  
**Status:** Open  
**Triage:** ready-for-agent  
**Blocked by:** #007, #008

## Parent

[PRD v1: Team Image Annotation](../PRD-v1-image-annotation.md)

## What to build

**Export** API and UI: produce flat PNG of **full canvas**—base image at original pixel dimensions plus all **markup objects**, ignoring current viewport zoom/pan. Server-side **export compositor** module (e.g. Sharp) with unit tests using fixture image + markup stack.

## Acceptance criteria

- [ ] Export button downloads or opens PNG (US 54)
- [ ] Output dimensions match base image (US 55)
- [ ] Export independent of zoom/pan (US 56)
- [ ] Output is pixels only—no editable markup (US 57)
- [ ] Compositor unit tests with known fixture

## Blocked by

- #007 — Arrow and freehand tools
- #008 — Text markup tool

## User stories

54, 55, 56, 57
