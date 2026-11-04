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
- Page components live in `src/pages/` and stay thin; their child components,
  hooks and helpers live in `src/components/<page>/`.

## Risk controls

- Do not edit `dist/` — it is a build output.
- Do not edit `public/ngsw-worker.js` — it is generated.
