# 022 — Layers panel for markup stack

**Type:** AFK  
**Status:** Done  
**Triage:** ready-for-agent  
**Blocked by:** [021](./021-selection-properties.md)

## Parent

[README v3](./README-v3.md)

## Problem

No list of markup objects. Z-order is only reachable via bring-forward/send-back toolbar buttons. Busy screenshots with many callouts are hard to navigate.

## What to build

- Layers tree in the **left sidebar** below Sessions (Figma-style: pages + nested layers)
- Each **artboard** is a collapsible **Frame** root; **base image** and **markup objects** nest underneath
- Click layer → select object on canvas; shift-click multi-select optional
- Click frame or image row → select artboard frame or base image on canvas
- Show type icon + short label (text content preview or type name)
- Reorder via drag or context actions (stretch: drag reorder)

## Acceptance criteria

- [x] Artboard shown as frame root with nested image + markup rows
- [x] All markup objects listed under active artboard frame
- [x] Click layer selects object; selection highlights in list
- [x] Click frame/image row selects frame or base image
- [x] List order matches z-order (markup front-to-back, image behind markup)
- [x] Right panel shows properties only (no duplicate layers list)
- [x] E2E: `e2e/v3-layers-panel.spec.ts` — tree in left sidebar, selection, z-order, collapse, multi-artboard

## E2E spec

`e2e/v3-layers-panel.spec.ts` — one `test()` per acceptance criterion above.

### Stable selectors

| `data-testid` | Element |
|---------------|---------|
| `layers-panel` | Layers section (left sidebar only) |
| `layers-list` | Tree root list |
| `layer-artboard` | Artboard node (frame root + children) |
| `layer-artboard-toggle` | Expand/collapse chevron |
| `layer-frame` | Artboard frame row |
| `layer-image` | Base image row under frame |
| `layer-item` | Markup object row |
