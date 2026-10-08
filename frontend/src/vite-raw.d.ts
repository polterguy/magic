/*
 * Lets a module import another file's text directly, via Vite's own `?raw`
 * suffix convention, as a plain string. Used to embed the canonical
 * magic-widgets.js/.css source into the dashboard bundle itself — see
 * designer/widgetRuntime.ts — so there is exactly one real copy of that
 * source on disk, not a hand-maintained duplicate that drifts the first
 * time one of them is edited and the other forgotten.
 */
declare module '*?raw' {
  const content: string;
  export default content;
}
