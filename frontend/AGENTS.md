# frontend/AGENTS.md

React + Vite + TypeScript single-page app — the Magic dashboard.

## Commands

# Install dependencies
npm install

# Dev server on http://localhost:4201
npm run dev

# Typecheck + production build (outputs to dist/)
npm run build

# Preview the production build
npm run preview

# Run tests (single run, no watch)
npm run test

# Prove every feature can be removed (slow; add -- <id> for one)
npm run check:removable

# Lint (zero warnings) / auto-fix
npm run lint
npm run lint:fix

# Prettier: write / check
npm run format
npm run format:check

## Project facts

- Vite dev server runs on port 4201, not the Vite default 5173.
- `npm run build` runs `tsc && vite build` — TypeScript errors fail the
  build.
- The dashboard talks to the backend at a URL configured in the app UI at
  runtime, not hardcoded in source.
- `public/ngsw-worker.js` is a generated PWA service worker. Do not edit
  manually.
- ESLint runs with `--max-warnings 0`. A rule that does not fit is turned off in
  `eslint.config.js` with the reason, not with inline disables.
- `npm install` installs the husky git hooks (commit-msg: commitlint;
  pre-commit: lint-staged; pre-push: format check, lint, typecheck, tests).
- Tests live in a `test/` folder next to what they test (e.g. `src/features/sql/test/`,
  `src/shared/api/test/`) and run in Node by default. Component and hook tests opt into a DOM with
  `// @vitest-environment jsdom` on their first line, and use Testing Library
  (`src/test/setup.ts` adds the jest-dom matchers and registers every feature).

## Architecture: a modular monolith

`src/` has three layers, each with a path alias:

| Folder | Alias | Holds |
| --- | --- | --- |
| `app/` | `@app/` | The shell: entry point, route table, layout, command palette, auth screens |
| `shared/` | `@shared/` | Everything reusable, grouped by area (below) |
| `features/<id>/` | `@features/` | One folder per dashboard section, plus Chat Ops (`chat`) |

`app/` is laid out like a feature: `main.tsx` (the entry `index.html` loads), `routes/AppRoutes.tsx`
(the login gates and the route table built from the feature registry), `pages/` (not-found and
the auth screens), `components/` (layout, palette, dialogs), `lib/` (feature discovery, OIDC),
`styles/app.css` and `test/`.

`shared/` holds `api/` (transport and calls several features make, the socket), `auth/` (auth
context, stored backends), `shell/` (the feature registry, shell actions, shortcuts, Chat Ops
events), `lib/` (errors, toasts, nav guard, theme, font, and plain helpers), `hooks/`, `ui/`
(generic components) and `resources/` (editor language support).

Every feature can be deleted with its folder and the app still typechecks, builds and passes its
tests. What keeps that true:

- A feature folder holds `index.ts` (its manifest) and the subfolders `pages/` (the page its
  route renders), `components/`, `hooks/`, `lib/` (including `lib/api.ts`, its backend calls),
  `styles/` and `test/`. Nothing else sits at its root.
- The manifest (`FeatureManifest` in `shared/shell/features.ts`) declares the feature's route and
  lazy page, nav entry, palette links and data sources, shortcuts, and an optional `shell`
  component the layout keeps mounted. `app/lib/registry.ts` finds manifests with
  `import.meta.glob`, so adding or removing a feature needs no other edit.
- Features never import each other, and `app/` and `shared/` never import a feature.
  `eslint-plugin-boundaries` enforces this in `npm run lint`. To link to another feature use
  `featureHref(id, suffix)` or `<FeatureLink>`, which render nothing when that feature is
  missing; use `hasFeature(id)` to hide anything else that depends on one.
- Anything a feature contributes to the shell at runtime (footer buttons, palette actions) goes
  through `shared/shell/shellActions.ts`, and is withdrawn when the feature unmounts.
- A backend call only one feature makes belongs in that feature's `lib/api.ts`, on the `http`
  helper from `@shared/api`. Tests that mock `@shared/api` also mock `../lib/api`.
- Styles only one feature uses live in `styles/<id>.css`, imported by the manifest so it loads
  after `app/styles/app.css`. Keep a rule global when moving it could change the cascade.
- Tests of app and shared code register stand-in features (`registerFeatures`) rather than
  relying on real ones; a feature's test that links into another uses `withStandInFeatures`.
- `npm run check:removable` proves the whole thing: for each feature it typechecks, builds and
  tests a copy of the frontend without that feature (`-- <id>` for one feature,
  `-- --no-tests` for a quicker pass).

## Risk controls

- Do not edit `dist/` — it is a build output.
- Do not edit `public/ngsw-worker.js` — it is generated.
