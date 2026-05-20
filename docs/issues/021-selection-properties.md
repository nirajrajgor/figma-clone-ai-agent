# 021 — Selection-aware properties panel

**Type:** AFK  
**Status:** Done  
**Triage:** ready-for-agent  
**Blocked by:** v2 complete

## Parent

[README v3](./README-v3.md) — Figma gap / editor polish

## Problem

When a markup object is selected, the right panel shows **tool defaults** (stroke color/width), not the selected object's stored values. Only text objects get per-object editing. This breaks Figma-like expectations and makes restyling existing annotations impossible without redraw.

## What to build

- Inspector reflects **selected object(s)** properties when select tool + selection active
- Edits patch all selected objects (skip types that don't support a field, e.g. no stroke on redact)
- Support stroke color/width, fill toggle, fill color for rectangle/ellipse; fill color for redact
- Multi-select: apply changes to all; display common value when unanimous
- Selecting a single shape syncs tool defaults for next draw

## Acceptance criteria

- [x] Select rectangle → inspector shows its stroke/fill, not tool defaults
- [x] Change stroke color on selection → canvas updates, persists after reload
- [x] Multi-select → stroke change applies to all selected stroke-capable objects
- [x] Text selection still shows text-specific fields; redact shows fill color
- [x] Unit test for `updateObjects` helper
- [x] E2E: select shape, change stroke in panel, verify SVG stroke attribute changes
