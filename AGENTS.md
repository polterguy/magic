# AGENTS.md

Magic Cloud is a .NET 10 backend + React/Vite/TypeScript frontend with a
Hyperlambda DSL runtime built on the Active Events (slots/signals) pattern.
~30 C# plugin projects live in `plugins/`, each with a `.tests` companion.

## Commands

# Backend — builds and starts API on http://localhost:5000
cd backend && dotnet run

# Frontend — dev server on http://localhost:4201
cd frontend && npm install && npm run dev

# One plugin's tests
cd plugins/<plugin>/<plugin>.tests && dotnet test

# All backend tests (run from repo root)
dotnet test magic.sln

# Frontend typecheck + production build
cd frontend && npm run build

# Frontend tests (single run, no watch)
cd frontend && npm run test

## Project facts

- .NET 10 SDK required (no global.json pins it)
- Frontend uses Vite + React + TypeScript, not Angular CLI
- Default login: root / root
- CI triggers only on version tags (v*.*.*), not on branch pushes or PRs
- Running `dotnet test magic.sln` from the repo root builds and tests all
  backend projects including plugins

## Counterintuitive patterns

- `backend/backend.csproj` copies `files/**` to the output directory with
  PreserveNewest. Editing files under `backend/files/` changes runtime
  behavior without a rebuild.
- Plugins communicate through slots/signals, not direct project references.
  A C# slot is registered with `[Slot(Name = "...", ValueKind = ...)]` and
  invoked by name in Hyperlambda. Adding a new slot does not require
  referencing the consuming project.
- `magic.node` and `magic.signals` are foundational — changes ripple to
  all plugins. Plan before touching them.
- `backend/backend.csproj` references only three plugin projects directly
  (magic.lambda.python, magic.lambda.system, magic.library). Other plugins
  are pulled in transitively through `magic.library`.

## Risk controls

- `backend/files/config/appsettings.json` contains secrets and is
  git-tracked. Never commit changes to this file.
- Do not modify `frontend/public/ngsw-worker.js` — it is a generated PWA
  service worker.
- Do not run database migrations or schema changes without asking.
- SQLite native plugins in `backend/sqlite-plugins/` are platform-specific
  binaries; do not replace them with builds from another architecture.
- Do not modify files under `.do/` or `docker.*` — they are deployment
  artifacts with an immutability policy.

## Decision rules

- Ask before modifying `magic.sln` or adding/removing project references.
- Plan before touching `magic.node` or `magic.signals` — they are
  load-bearing for all plugins.
- Run `dotnet test` on the affected plugin before submitting changes.
- Prefer editing Hyperlambda files under `backend/files/` directly — no
  build step is needed for runtime content changes.
