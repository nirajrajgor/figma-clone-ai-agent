# View-only share links alongside name-based editor access

**Status:** Deferred (not v2)

v1 handed annotated screenshots to outsiders only via **export** (flat PNG) or by giving them the full **session path** (workspace, project, session id)—which also grants edit powers under **open collaboration**. v2 adds **view links**: one opaque **share token** per active link opens a **view-only session** without exposing workspace or project names and without edit capability.

Editors keep **name-based access** and **open collaboration** unchanged (ADR 0001). Viewers use a separate gate: the token in the URL. Security for sensitive screenshots still depends on unguessable tokens (and revoking links when done), not identity proof—same trade-off as v1, narrowed to read-only.

**Considered options:** (a) View-only query param on existing session URL—rejected because it leaks workspace/project/session id and is easy to misuse as an editor URL. (b) Multiple concurrent tokens per session—rejected for v2 complexity; one active link with regenerate suffices. (c) Login + viewer role—deferred; teams asked for handoff without accounts first. (d) Real-time updates for Viewers—deferred; refresh matches v1 persistence model.

**Consequences:** Operators must treat copied view links like passwords. Regenerating a link breaks old bookmarks. View API responses must not include workspace or project names. Auth and live sync remain future ADRs if teams outgrow this.
