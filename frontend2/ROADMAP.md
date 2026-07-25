# frontend2 roadmap — synthesized from a full study of the Angular dashboard

Produced 2026-07-25 (overnight session). Five parallel deep-dives over the old
codebase: SQL Studio, Databases, Hyper IDE, Endpoints/Generator/AI, and all
remaining areas. This file is the prioritized gap list; details (files,
endpoints, UI shapes) are in the study notes below each item.

## Already ported (verified working)

Auth + JWT refresh, layout with collapsible sidebar, Dashboard (basic),
Playground (execute, snippets load/save, result modes), Hyper IDE (recursive
tree + sys-toggle + filter + splitter, edit/save, execute with parametrise
dialog via get-arguments/evaluate-with-args, ResultViewer with content-type
dispatch incl. HTML preview + downloads, unsaved-changes guard, autocomplete
Ctrl+Space, Alt+M/Alt+S/F5), SQL (execute, safe mode, result grids), Endpoints
(list/filter/detail), Users & roles, Task Manager (CRUD + schedules basic),
Log, app-wide dialog system (no native alerts), old slugs/names.

## Tier 1 — build next (explicitly requested + daily-driver gaps)

1. **Endpoints invoker** — real "try it" panel: verb dispatch with actual HTTP
   verbs against the endpoint path, query-param builder for GET/DELETE
   (date→ISO), auto-generated sample JSON payload from `input` meta
   (int→42, string→"foo", bool→true, decimal→5.5, date→now) for
   POST/PUT/PATCH, response via ResultViewer with status + elapsed ms.
   (Old: `endpoints-result.component`. Assumptions/tests: dead code in old
   frontend — skip.)
2. **Databases screen** (`/databases` slug) — two tabs:
   - Internal (SQLite): list (`sql/databases`), create (`sql/ddl/database`),
     delete (typed-name confirm), download backup (`file-with-token`),
     upload backup (`PUT sql/backup`). `magic` db protected.
   - External (mysql/pgsql/mssql): list connection strings from
     `config/load` + live status via `sql/test-connection-string`,
     add (test→connect flow, `{database}` placeholder validation),
     delete, create catalog, manage catalogs. Links into SQL Studio +
     Generator with `?dbType&dbCString&dbName`.
3. **SQL Studio parity, chunk 1** — snippets (load/save
   `/etc/{dbType}/templates/*.sql`), client-side CSV export of result grids,
   import .sql file, execute-selection, deep-link query params, Ctrl-Space
   SQL hints from schema (tables/columns from `sql/databases` meta).
4. **SQL Studio parity, chunk 2 — designer (Tables view)** — table cards from
   schema meta, create table (PK auto-derive), drop table, add column/FK
   (per-dialect type catalogs — L), drop column/FK/index, link tables,
   export DDL (table + full db), export to module, auto-migration dialogs,
   CSV table download, import CSV.
5. **OpenAPI spec dialog** — `GET /magic/system/endpoints/openapi?system=true&filter={folder}`
   from Hyper IDE folder/endpoint-file actions + Endpoints screen; copy JSON
   + copy URL buttons.
6. **Hyper IDE quick wins** — upload files (multipart to active folder),
   download file/folder(zip), copy-path button, system-folder rename/delete
   guards + red tint, remaining shortcuts (Alt-A/B new file/folder,
   Alt-R/L rename, Alt-D/X delete, Alt-C close, Alt-V insert snippet,
   Alt-P markdown preview), execute-selection, shortkeys help dialog,
   install-module (zip) + unzip, incompatible-file dialog.
7. **Task Manager schedule dialog** — 3 modes: fixed datetime (`due`),
   repeat picker n×{seconds..months} → `"5.minutes"`, custom pattern
   (`MM.dd.HH.mm.ss` / `ww.HH.mm.ss` formats documented in UI).
8. **Configuration screen** — appsettings.json CodeMirror editor
   (`config/load` / `config/save`), SMTP dialog, reCAPTCHA dialog, OpenAI
   key dialog, download/upload backup of appsettings.json.
9. **Profile + Generate-token** — change password, name (users_extra),
   generate JWT dialog (username/roles/expiry via crypto service).

## Tier 2 — the AI stack (needs a shared SignalR streaming component first)

- **SignalR feedback/streaming component** — one reusable piece powering:
  import/vectorize progress, chatbot-wizard crawl progress, vibe-coding
  token streaming, execute-feedback actions. Socket: `{url}/sockets`,
  bearer token, channel = gibberish session id.
- **Vibe coding console** (old dashboard centerpiece) — streaming agent chat
  with markdown/highlight/mermaid, function-invocation badges,
  download_file/render_html message types, file attachments, MCP URL copy.
- **Machine Learning suite** (XL — biggest remaining surface):
  types registry, edit-type (~30 fields, flavors, token budget), training
  data (VSS semantic search, bulk train/untrain, export), import (crawl,
  files, csv, images), test chat, embed-UI script generator, history,
  questionnaires.
- **Create AI functions** — `openai/available-workflows` list → install
  generates declaration via `workflows/get-hyperlambda-arguments` → saved as
  training snippet (`FUNCTION_INVOCATION` meta). Plus Hyper IDE ⚡ bolt:
  generate AI function training snippets per file/folder (select-model
  dialog, `ml_types`).
- **CRUD Generator** (L) — per-verb crudify with auth roles, logging,
  caching, CQRS socket messages, paging/sorting, single-table column config,
  FK handling; posts one `crudifier/crudify` per verb/table.
- **SQL endpoint generator** (M) — custom SQL → endpoint
  (`crudifier/custom-sql`), typed args dialog, verb + module/endpoint names.
- **Chatbot wizard** (L) — create-bot from URL with SignalR crawl progress,
  model/flavor pickers, reuses embed-UI dialog.
- **Hyper IDE workflow toolbox** (L) — actions + snippets panel
  (`workflows/actions|snippets|get-action-arguments|get-hyperlambda`),
  parametrise with candidates (`:x:` expressions), insert at caret;
  edit-arguments (Alt-Q, `apply-arguments`); new-.hl-file AI scaffold.
- **AI prompt panel** in editors (openai/chat + external HL generator).

## Tier 3 — lower priority

Plugins/Bazar (external bazar list + install-plugin), setup wizard,
theme service (named themes + CodeMirror themes), PWA update, multi-backend
switcher, version-update banner, ML history/questionnaires exports,
socket-type endpoint invocation in the invoker.

## Notes

- Old frontend facts discovered: macros are dead code (skip); endpoint
  assumptions/tests are removed remnants (skip); OpenAPI *generator* tab is
  feature-flagged off (skip for now); Angular dashboard has NO KPI charts —
  its dashboard is the vibe-coding console.
- Cross-cutting pieces to build once: typed-name confirm dialog (exists),
  SignalR streaming component, gibberish session helper, OpenAI-configured
  gate, cache-bust helper (`cache/delete?id=magic.sql.databases.*`).
