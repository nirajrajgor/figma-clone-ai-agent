# 023 — Inline text editing on canvas

**Type:** AFK  
**Status:** Done  
**Triage:** ready-for-agent  
**Blocked by:** —

## Parent

[README v3](./README-v3.md)

## Problem

Text tool opens a modal dialog. Figma and most design tools use double-click / inline edit on canvas for faster callouts.

## What to build

- Place text with single click or drag-to-size box (keep minimal: click + type)
- Double-click existing text → edit in place (contenteditable or input overlay)
- Remove or bypass modal for new text; Enter commits, Escape cancels

## Acceptance criteria

- [x] New text without modal (or optional quick default)
- [x] Double-click text object → inline edit
- [x] Shortcuts disabled while inline editing
- [x] E2E: add and edit text label on canvas
