# 020 — Upload size limits and validation UX

**Type:** AFK  
**Status:** Open  
**Triage:** ready-for-agent  
**Blocked by:** v1 complete

## Parent

[PRD v2: Richer markup and polish](../PRD-v2-markup-and-polish.md)

## What to build

Server max upload size (config constant, e.g. 15 MB) on session create and replace base image. `413` + JSON error. Client shows clear message before/after upload.

## Acceptance criteria

- [ ] Oversize upload rejected with readable error (US 16)
- [ ] Within-limit uploads unaffected

## User stories

16
