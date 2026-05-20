# Next.js full-stack for the team instance

The browser UI and HTTP API ship as one **Next.js** application (App Router). API Route Handlers (or Server Actions where appropriate) implement the backing service; **SQLite** persists workspaces, projects, markup sessions, and image blobs on the server. This matches option C from discovery (UI + local/team service) with a single deployable unit for a team instance.

**Considered options:** Separate SPA + Express/FastAPI backend; Tauri desktop. Rejected for v1 to reduce moving parts and align with team preference for Next.js.

**Consequences:** Export compositor and thumbnails run server-side in Node (e.g. Sharp). E2E tests may use Playwright against the Next dev server. A separate local instance per developer uses the same app pointed at a local SQLite file.
