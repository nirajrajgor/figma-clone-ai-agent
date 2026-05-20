# 013 — Project deletion with confirmation

**Type:** AFK  
**Status:** Open  
**Triage:** ready-for-agent  
**Blocked by:** #003

## Parent

[PRD v1: Team Image Annotation](../PRD-v1-image-annotation.md)

## What to build

From project context, Annotator can **delete project** after re-typing the project name (strong confirm). Removes all **markup sessions** under that project. **Workspace deletion** remains unavailable in UI.

## Acceptance criteria

- [ ] Delete project UI requires typing project name to confirm (US 15)
- [ ] All sessions under project removed from DB and storage
- [ ] No workspace delete in UI (US 16)

## Blocked by

- #003 — Workspace and project entry flow

## User stories

15, 16
