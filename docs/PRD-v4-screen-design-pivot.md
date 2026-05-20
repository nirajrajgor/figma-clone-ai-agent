# PRD: Screen design pivot (v4)

**Status:** Accepted (grill session)  
**Domain glossary:** [CONTEXT.md](../CONTEXT.md)  
**ADR:** [0004-screen-design-pivot.md](./adr/0004-screen-design-pivot.md)

## Problem

Designers want to lay out mobile, tablet, and desktop screens and lightly adjust placed images—not only annotate screenshots. The current product forces an image upload and optimizes for markup-over-screenshot.

## Solution

Phased pivot (**design + light edit**): device-sized frames on one canvas, vector primitives, optional images, export per frame. Keep name-based access and last-write-wins collaboration. Retain annotation/review tools for screenshot workflows.

## Phases

| Phase | Deliverables |
|-------|----------------|
| **1 — Design MVP** | Device presets; create **design file** without upload; empty frames; UI copy pivot; rectangle/ellipse/line/text as layout primitives |
| **2 — Light image edit** | Brightness/saturation on **image layer**; export all frames; curated font list (3–5 families) |
| **3 — Structure** | **Groups** in layers panel; duplicate frame; icons/SVG paste |
| **Deferred** | Components/instances, auto-layout, constraints, prototyping, design tokens, real-time multiplayer, Photoshop tools |

## Out of scope (all phases)

Responsive constraint engine, production code export, full font catalog, clone/heal brush, replacing Figma for large teams.

## Preset sizes (initial)

| Preset | Size (px) |
|--------|-----------|
| Phone | 390 × 844 |
| Tablet | 768 × 1024 |
| Desktop | 1440 × 900 |

Custom frame sizes allowed (existing frame tool).
