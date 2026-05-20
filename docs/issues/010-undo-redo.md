# 010 — Undo and redo (local editor)

**Type:** AFK  
**Status:** Open  
**Triage:** ready-for-agent  
**Blocked by:** #009

## Parent

[PRD v1: Team Image Annotation](../PRD-v1-image-annotation.md)

## What to build

**Undo** / redo stack local to the Annotator’s editor for the current **markup session**: add, delete, move, style changes. Saving still persists current document (last-write-wins). Unit-test undo module separately from UI.

## Acceptance criteria

- [ ] Undo reverses recent edit (US 48)
- [ ] Redo works after undo
- [ ] Covers add, delete, move, style (US 49)
- [ ] Undo history not shared across Annotators or sessions (US 50)
- [ ] Unit tests for undo command stack

## Blocked by

- #009 — Selection, move, delete, and z-order

## User stories

48, 49, 50
