# 001 — Implementation stack (Next.js + SQLite)

**Type:** HITL  
**Status:** Decided  
**Triage:** ready-for-agent  
**Blocked by:** None — can start immediately

## Parent

[PRD v1: Team Image Annotation](../PRD-v1-image-annotation.md)

## What to build

Record and scaffold the v1 stack:

- **Next.js** (App Router) for UI + API Route Handlers
- **SQLite** for persistence (e.g. better-sqlite3 or Drizzle + SQLite)
- **Sharp** (or equivalent) for server-side image/thumbnail/export later
- Test runner: Vitest (unit) + optional Playwright (E2E later)
- Deep modules to unit-test: markup document, undo history, export compositor, session repository

See [ADR 0002: Next.js full-stack](../adr/0002-nextjs-full-stack.md).

Deliver a minimal app directory (`app/`, `package.json`, dev script) so slice 002 can extend it.

## Acceptance criteria

- [x] Stack documented in ADR 0002 and README
- [x] Next.js app boots with `npm run dev`
- [x] README explains team instance and link to CONTEXT.md
- [x] Playwright configured; headful default via `npm run e2e` ([E2E.md](./E2E.md))
- [ ] SQLite file location documented when #002 lands

## Blocked by

None — can start immediately
