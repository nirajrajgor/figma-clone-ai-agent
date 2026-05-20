# PRD: View-only sharing (v2)

**Status:** Deferred (not v2; share not needed yet)  
**Domain glossary:** [CONTEXT.md](../CONTEXT.md)  
**Parent:** [PRD v1](./PRD-v1-image-annotation.md)  
**Related ADR:** [0003-view-only-share-links.md](./adr/0003-view-only-share-links.md)

---

## Problem Statement

v1 closes the loop for **Annotators** on a team instance but forces a bad choice for outsiders: receive a PNG (**export**) and lose the ability to pan/zoom in the product, or receive the **session path** and inherit full edit/delete powers under **open collaboration**. Teams want “look at this annotated screenshot in the app” without onboarding people to workspace/project names or risking accidental edits.

## Solution

v2 adds **view links** per **markup session**: Annotators with the **session path** create, copy, revoke, or regenerate a single active link. **Viewers** open `/view/{shareToken}` for a **view-only session**—same base image and markup stack, pan/zoom, refresh for updates, optional **export**—with no editing UI and no navigation into the project. Editors continue to use name-based paths; ADR 0001 still governs collaboration among Annotators.

## User Stories

### Share link management (Annotators)

1. As an Annotator, I want a **Share** control on the session editor, so that I can hand a session to outsiders without export.
2. As an Annotator, I want to create a view link when none exists, so that the instance mints a **share token** and shows a copyable URL.
3. As an Annotator, I want to copy the view link to the clipboard in one action, so that I can paste it into Slack or email.
4. As an Annotator, I want to revoke the view link, so that a leaked link stops working.
5. As an Annotator, I want to regenerate the view link, so that I can invalidate an old link without deleting the session.
6. As an Annotator, I want at most one active view link per session in v2, so that link management stays simple.
7. As an Annotator, I want any Annotator who knows the **project path** to manage view links for sessions in that project, so that sharing matches **open collaboration**.

### View-only experience (Viewers)

8. As a Viewer, I want to open a view link without entering workspace or project names, so that handoff is frictionless.
9. As a Viewer, I want to see the session title and annotated canvas, so that I understand what I am looking at.
10. As a Viewer, I want pan and zoom on the **canvas viewport**, so that I can inspect details on large screenshots.
11. As a Viewer, I want markup to stay aligned with the image when I pan and zoom, so that annotations remain correct.
12. As a Viewer, I want no toolbar, selection handles, or property panel, so that I cannot accidentally edit.
13. As a Viewer, I want to refresh the page to see the latest saved markup, so that I see updates after Annotators save (no live sync in v2).
14. As a Viewer, I want to export a full-canvas PNG from the view page, so that I can save or forward pixels without edit access.
15. As a Viewer, I want a clear message when a link is revoked or invalid, so that I know the session is unavailable.

### Security and privacy expectations

16. As an Annotator, I want the view URL to omit workspace and project names, so that link recipients learn less about our namespace layout.
17. As an Annotator, I want the view API to omit workspace and project names in responses, so that browser tools do not leak them.
18. As an Annotator, I want to treat view links as secrets (long random tokens), so that security matches v1 name-based expectations.
19. As an operator, I want revoked tokens to return 404, so that access ends immediately.

## Implementation Decisions

### Architectural shape

- **Unchanged:** Next.js team instance, SQLite, name-based editor routes, last-write-wins persistence, local undo for Annotators.
- **New surface:** Public view route `/view/[token]` and token-scoped API under `/api/view/[token]/…` that never requires workspace/project segments.
- **Reuse:** Canvas viewport + markup render path from the editor (read-only shell); **export compositor** for Viewer export.

### Data model

Add to `markup_sessions` (or equivalent):

| Column | Type | Notes |
|--------|------|--------|
| `shareToken` | text, nullable, unique | Opaque secret; null = no active link |
| `shareTokenCreatedAt` | timestamp, nullable | Audit / future expiry |

Token generation: cryptographically random, ≥ 128 bits entropy, URL-safe encoding (e.g. 22+ char base64url).

### API contracts (behavioral)

**Annotator (requires session path):**

- `GET …/sessions/:sessionId/share` — `{ active: boolean, url?: string, createdAt?: string }`
- `POST …/sessions/:sessionId/share` — create link if absent; idempotent return if already active
- `DELETE …/sessions/:sessionId/share` — revoke (clear token)
- `POST …/sessions/:sessionId/share/regenerate` — new token; old URL 404s

**Viewer (token only):**

- `GET /api/view/:token` — `{ title, baseImageUrl, width, height, markupStack }` (no workspace/project)
- `GET /api/view/:token/image` — base image bytes
- `GET /api/view/:token/export` — full-canvas PNG (same semantics as editor export)

All view routes: 404 if token missing/revoked; no global list endpoints.

### UI

- **Editor:** Share menu/dialog on session editor navbar (status: none / active, copy, revoke, regenerate).
- **View page:** Minimal chrome—title, optional export button, read-only canvas, footer note “Refresh to see updates.” No sidebar, no session list, no link to editor entry flow.

### Modules (delta from v1)

| Module | Responsibility |
|--------|----------------|
| **Share token repository** | Mint, lookup by token, revoke, regenerate on session row |
| **View session API** | Resolve token → session; serve image/export without path leak |
| **View shell** | Read-only composition of viewport + render; no tool controllers |
| **Share dialog** | Annotator UI wired to share endpoints |

**Recommended tests:** Share token repository (integration); view API contract (404 on bad token, no ws/project in JSON); export via token matches editor export; Playwright: create link → open in new context → no edit controls → revoke → 404.

## Out of Scope (v2)

- Login, accounts, OAuth, Annotator/Viewer RBAC
- Real-time sync, live cursors, CRDT/OT for Viewers or Annotators
- Multiple active view links per session; link expiry schedules; password on links
- Embed iframe widget; analytics on link opens
- Viewers editing or commenting; Viewers seeing other sessions in the project
- Workspace/project names in view URL or API
- Changes to **open collaboration** among Annotators
- New markup tools (ellipse, blur, etc.)
- Upload size limits, LAN discovery (ops—separate release)

## Deferred (post–v2)

| Candidate | Rationale |
|-----------|-----------|
| Auth + roles | Larger access-model change; ADR 0001 revisit |
| Real-time sync | Infrastructure + UX; separate from sharing |
| Link expiry | Revoke/regenerate enough for v2 |
| Richer markup tools | Orthogonal to sharing |

## Further Notes

- **Implementation issues:** [docs/issues/README-v2.md](./issues/README-v2.md)
- **Security:** Educate teams that view links are bearer secrets; regenerate after leaks. Sensitive screenshots may still warrant export-only handoff.
- **Migration:** Existing sessions have `shareToken = null`; no link until created.
