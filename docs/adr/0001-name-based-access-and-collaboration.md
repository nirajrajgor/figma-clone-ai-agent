# Name-based access, open collaboration, and last-write-wins

The product targets small teams who want Figma-like markup on images without accounts or infrastructure for auth. We chose **no login**: workspaces and projects are entered by name, with explicit create confirmation so typos do not spawn data. Knowing the exact workspace name, project name, and (for a canvas) session id is the only gate—security relies on unguessable names, not identity.

Within a project, **open collaboration** applies: anyone who can reach the team instance and knows the path can create, edit, and delete sessions and markup. There is no viewer role in v1. Concurrent editors use **last write wins** on save—no live cursors or CRDT/OT. That keeps v1 small while export remains the primary handoff to outsiders.

**Considered options:** Login + RBAC; view-only share links; real-time multiplayer sync; loopback-only single-user instances. Rejected for v1 to ship faster and match “guess the project name” access. Revisit when misuse, compliance, or editing conflicts appear.

**Consequences:** Short or predictable names are unsafe. Two Annotators can overwrite each other’s work. Undo is local to one editor until persisted state wins. A future ADR may add view-only links, auth, or sync if teams outgrow this model.
