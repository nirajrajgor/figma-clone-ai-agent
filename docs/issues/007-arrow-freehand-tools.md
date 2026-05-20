# 007 — Arrow and freehand tools

**Type:** AFK  
**Status:** Open  
**Triage:** ready-for-agent  
**Blocked by:** #006

## Parent

[PRD v1: Team Image Annotation](../PRD-v1-image-annotation.md)

## What to build

**Arrow markup**: straight line, start/end points, arrowhead; stroke color/width. **Freehand markup**: one pointer-down to pointer-up stroke = one object; stroke color/width; no eraser tool. Both persist in **markup stack** and reload with rectangles.

## Acceptance criteria

- [ ] Straight arrow only—two-point creation (US 29, 31)
- [ ] Arrow stroke color and width (US 30)
- [ ] Freehand pen creates one object per stroke (US 38, 39)
- [ ] No eraser tool in toolbar (US 40)
- [ ] Freehand stroke color and width (US 41)
- [ ] Persist and reload with other objects

## Blocked by

- #006 — Rectangle tool with persisted markup stack

## User stories

29, 30, 31, 38, 39, 40, 41
