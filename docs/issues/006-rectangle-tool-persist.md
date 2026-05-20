# 006 — Rectangle tool with persisted markup stack

**Type:** AFK  
**Status:** Open  
**Triage:** ready-for-agent  
**Blocked by:** #005

## Parent

[PRD v1: Team Image Annotation](../PRD-v1-image-annotation.md)

## What to build

**Rectangle** **markup tool**: draw **rectangle markup** with stroke color/width; optional semi-transparent fill (toggle; sensible default with light fill). **Markup stack** persists to the **instance** (debounced save). Reload or second browser shows saved rectangles. **Concurrent editing**: last write wins on save; no live sync.

Introduce **markup document** module (serialize/deserialize) tested in isolation.

## Acceptance criteria

- [ ] Draw rectangle on canvas in image space (US 25)
- [ ] Stroke color and width configurable (US 26)
- [ ] Fill toggle and semi-transparent fill (US 27, 28)
- [ ] Save markup stack; refresh shows same rectangles (US 51, 61)
- [ ] Second client save overwrites per last-write-wins (US 52, 62)
- [ ] Open collaboration: same project path can edit (US 58)
- [ ] Unit tests for markup document round-trip

## Blocked by

- #005 — View-only canvas (base image + viewport)

## User stories

25, 26, 27, 28, 51, 52, 58, 61, 62
