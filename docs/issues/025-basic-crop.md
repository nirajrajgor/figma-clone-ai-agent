# 025 — Non-destructive crop on base image

**Type:** AFK  
**Status:** Done  
**Triage:** ready-for-agent  
**Blocked by:** —

## Parent

[README v3](./README-v3.md)

## Problem

No way to crop the base image. Figma baseline expects inline non-destructive crop with canvas handles.

## What to build

- Crop mode on base image (double-click image or inspector button)
- Canvas handles, aspect ratio lock optional, Enter apply / Escape cancel
- Store crop rect in session document; render and export respect crop
- Non-destructive: full image retained on server

## Acceptance criteria

- [x] Enter crop mode, adjust bounds, commit
- [x] Cancel restores previous view
- [x] Export uses cropped region
- [x] E2E: crop and verify export bounds
