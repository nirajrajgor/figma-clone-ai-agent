# 029 — Export scale and format options

**Type:** AFK  
**Status:** Done  
**Triage:** ready-for-agent  
**Blocked by:** [024](./024-export-matches-artboard.md)

## Parent

[README v3](./README-v3.md)

## Problem

Export is PNG 1× only via navbar link. Figma offers PNG/JPG, 1×/2×/4×, quality settings.

## What to build

- Export menu or dialog: format (PNG/JPG), scale (1×, 2×), optional JPG quality
- API query params or POST body for export options
- Filename suffix reflects scale

## Acceptance criteria

- [x] Export 2× PNG doubles pixel dimensions
- [x] JPG export works without transparency
- [x] UI exposes format and scale without breaking one-click default export
