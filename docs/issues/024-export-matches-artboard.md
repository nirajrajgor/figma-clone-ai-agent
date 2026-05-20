# 024 — Export matches artboard framing

**Type:** AFK  
**Status:** Done  
**Triage:** ready-for-agent  
**Blocked by:** —

## Parent

[README v3](./README-v3.md)

## Problem

Export composes intrinsic base image + markup at full image dimensions. Artboard layout (image scale, offset, frame crop) is ignored — WYSIWYG export does not match canvas.

## What to build

- Export renders active artboard: frame bounds, image positioned/scaled per layout, markup in image coordinates
- Markup coordinates remain in image space; compositor maps through layout transform
- Document expected behavior in CONTEXT.md if export bounds change

## Acceptance criteria

- [x] Scaled-down image in frame → export shows same scale/position
- [x] Compositor unit tests with non-default layout
- [x] E2E or API test: export dimensions match artboard/frame policy
