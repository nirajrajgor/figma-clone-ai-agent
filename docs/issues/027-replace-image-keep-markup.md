# 027 — Replace image without clearing markup

**Type:** AFK  
**Status:** Done  
**Triage:** ready-for-agent  
**Blocked by:** —

## Parent

[README v3](./README-v3.md)

## Problem

Replace base image clears entire markup stack. Figma preserves fill/crop when swapping assets.

## What to build

- When replacement image dimensions match (or within tolerance), keep markup stack
- When dimensions differ, offer choice: keep markup (may misalign) vs clear markup (current behavior)
- Preserve artboard layout where possible

## Acceptance criteria

- [x] Same-size replace keeps markup
- [x] Different-size replace shows confirm with options
- [x] E2E: replace same-size PNG, markup remains
