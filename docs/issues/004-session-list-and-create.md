# 004 — Markup session list and create

**Type:** AFK  
**Status:** Open  
**Triage:** ready-for-agent  
**Blocked by:** #003

## Parent

[PRD v1: Team Image Annotation](../PRD-v1-image-annotation.md)

## What to build

On the project page, Annotator sees all **markup sessions** in that **project**: thumbnail, **session title**, created timestamp. **Create** flow: upload base image (PNG, JPEG, WebP) + required **session title** → server assigns stable **session id** → navigates to session URL including session id.

Opening a session from the list uses the session route.

## Acceptance criteria

- [ ] Project page lists sessions with thumbnail, title, and created time (US 9)
- [ ] Create rejects missing title (US 10)
- [ ] Accepts PNG, JPEG, WebP only (US 17)
- [ ] New session URL contains stable session id (US 12)
- [ ] Clicking a list item opens the session editor route (US 13)

## Blocked by

- #003 — Workspace and project entry flow

## User stories

9, 10, 12, 17
