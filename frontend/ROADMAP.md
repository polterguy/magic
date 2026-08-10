# frontend2 roadmap — synthesized from a full study of the Angular dashboard

Produced 2026-07-25 (overnight session), refreshed 2026-08-10 after the
shared-primitives/UX/a11y sweep. Five parallel deep-dives over the old
codebase: SQL Studio, Databases, Hyper IDE, Endpoints/Generator/AI, and all
remaining areas. This file is the prioritized gap list.

## Already ported (verified working)

Auth + JWT refresh (network-hiccup-safe, global 401 handling), layout with
collapsible sidebar, Dashboard (KPIs, agent card, chatbot wizard, task
runner), Playground (execute, snippets load/save with dirty-guard, result
modes), Hyper IDE (recursive tree + sys-toggle + filter + splitter,
edit/save, execute with parametrise dialog, endpoint invocation with
save-first guard, ResultViewer with content-type dispatch incl. HTML preview
+ downloads, unsaved-changes guard, autocomplete Ctrl+Space, Alt+M/Alt+S/F5,
uploads, file/folder(zip) downloads, copy-path, install-module + Git panel),
SQL Studio (execute, safe mode, capped result grids, snippets, CSV
export/import, execute-selection, deep-links, schema hints, Designer: table
cards, create/drop table, add column/FK, DDL export), Databases screen
(internal + external tabs, backups), Endpoints (grouped list/filter/detail +
real invoker + OpenAPI dialog), Users & roles (paged, CSV export), Task
Manager (CRUD + 3-mode schedule dialog), Log (cursor paging + filter),
Configuration (editor + SMTP/OpenAI/reCAPTCHA/Git dialogs + backup),
Profile + generate-token, ML suite (types, training data with VSS search,
import/crawl, embed, history, AI functions, widgets), CRUD generator, SQL
endpoint generator, chatbot wizard, AI prompt panel, SignalR feedback
component, multi-backend switcher, dark/light theme, app-wide dialog system
(modals with focus-trap + typed-name confirms), old slugs/names,
route-level code-splitting, server-paged list kit (usePagedList/Pagination).

## Still open

- **Hyper IDE workflow toolbox** — actions + snippets panel
  (`workflows/actions|snippets|get-action-arguments|get-hyperlambda`),
  parametrise with candidates (`:x:` expressions), insert at caret;
  edit-arguments (Alt-Q, `apply-arguments`); new-.hl-file AI scaffold.
- **Hyper IDE stragglers** — Alt-P markdown preview, Alt-V insert snippet,
  shortkeys help dialog, incompatible-file dialog.
- **Socket-type endpoint invocation** in the invoker (explicitly excluded in
  `InvokePanel.tsx` today).
- **PWA update flow**, **named themes + CodeMirror themes** (only dark/light
  exists), **version-update banner** — Tier 3.

## Dropped by decision (2026-07-25, Thomas)

- Vibe-coding console — NOT wanted.
- ML questionnaires, Twilio, webhooks, lead-gen (contact_us/lead_email),
  initial_questionnaire — legacy, dropped from UI and payloads.
- ML test-chat dialog — dropped.
- (Plus dead code in old frontend: endpoint assumptions, macros.)

## Notes

- Old frontend facts discovered: macros are dead code (skip); endpoint
  assumptions/tests are removed remnants (skip); OpenAPI *generator* tab is
  feature-flagged off (skip for now); Angular dashboard has NO KPI charts —
  its dashboard is the vibe-coding console.
- Cross-cutting pieces now built once and shared: typed-name confirm
  (`confirmTyped` in Dialogs), SignalR socket factory (`lib/socket.ts`),
  paged-list hook + Pagination, RoleChips, CSV/blob download helpers
  (`lib/download.ts`), database-selection + SQL AI-context (`lib/sql.ts`),
  cache-bust helper (`cache/delete?id=magic.sql.databases.*`).
