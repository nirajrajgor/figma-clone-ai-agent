# 028 — Image opacity and corner radius

**Type:** AFK  
**Status:** Done  
**Triage:** ready-for-agent  
**Blocked by:** —

## Parent

[README v3](./README-v3.md)

## Problem

No opacity or corner radius on image/frame container — common Figma composition controls.

## What to build

- Image or frame opacity slider (0–100%) in frame properties when image selected
- Corner radius on artboard clip region (uniform v1)
- Render in canvas and export compositor

## Acceptance criteria

- [x] Opacity slider affects image display and export
- [x] Corner radius clips image + markup inside frame content (define behavior)
- [x] Unit/compositor test for rounded clip export
