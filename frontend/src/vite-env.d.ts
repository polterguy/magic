/*
 * Vite's client types: they declare stylesheet and asset imports (import './styles.css'), which
 * TypeScript otherwise cannot resolve once noUncheckedSideEffectImports is on, the default in
 * newer TypeScript versions such as the one bundled with VS Code.
 */
/// <reference types="vite/client" />
