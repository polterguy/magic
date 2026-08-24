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

## Project facts

- Vite dev server runs on port 4201, not the Vite default 5173.
- `npm run build` runs `tsc && vite build` — TypeScript errors fail the
  build.
- The dashboard talks to the backend at a URL configured in the app UI at
  runtime, not hardcoded in source.
- `public/ngsw-worker.js` is a generated PWA service worker. Do not edit
  manually.

## Risk controls

- Do not edit `dist/` — it is a build output.
- Do not edit `public/ngsw-worker.js` — it is generated.
