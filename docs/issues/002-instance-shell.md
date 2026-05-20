# 002 — Runnable team instance shell

**Type:** AFK  
**Status:** Open  
**Triage:** ready-for-agent  
**Blocked by:** #001

## Parent

[PRD v1: Team Image Annotation](../PRD-v1-image-annotation.md)

## What to build

A thin vertical slice: one command starts the **team instance**. Next.js serves a minimal home page. An API health route returns OK. SQLite schema migrates tables for **workspace**, **project**, and **markup session** (columns sufficient for later slices; no business UI yet).

Annotator can open the instance URL in a browser and see the shell page.

## Acceptance criteria

- [ ] `npm run dev` starts UI + API
- [ ] `GET /api/health` (or equivalent) returns success
- [ ] SQLite database file created/applied via migration on startup or explicit migrate command
- [ ] Schema includes workspace, project, markup session entities (logical model per PRD)
- [ ] Home page confirms instance is running (minimal text is fine)
- [ ] `npm run e2e` passes — see `e2e/instance-shell.spec.ts` ([E2E guide](./E2E.md))

## Blocked by

- #001 — Implementation stack (Next.js + SQLite)
