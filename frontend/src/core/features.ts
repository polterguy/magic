/*
 * The feature registry — the only way the app, and features, learn that other features exist.
 *
 * Every folder under src/features/ exports a FeatureManifest from its index.ts. The app finds
 * them with import.meta.glob (app/registry.ts) and registers them here at startup, so deleting a
 * feature folder removes it from the build without touching anything else: its route, nav entry,
 * palette commands and shortcuts go with it.
 *
 * Features never import each other. A feature that links to another asks featureHref() for the
 * address, which is null when that feature is not part of this build, and drops the link then.
 */
import type { ComponentType, LazyExoticComponent } from 'react';

// A palette entry that navigates, contributed statically by a feature.
export interface PaletteLink {
  label: string;
  // Address relative to the feature's own path, e.g. '?guided=1'.
  to: string;
}

// A palette entry found by asking the backend — a file, an endpoint, a task.
export interface PaletteEntry {
  group: string;
  label: string;
  hint?: string;
  // HTTP verb, rendered as the Endpoints page's coloured badge.
  verb?: string;
  // Absolute address to navigate to.
  to: string;
}

export interface Shortcut {
  // A core group ('Global', 'Editor') or the title of a feature's shortcut group.
  group: string;
  // Human-readable combo, rendered as key chips split on " + ".
  display: string;
  // The macOS combo when it differs — Cmd for Ctrl, Opt for Alt, and the
  // Fn dance macOS demands for Ctrl+Space and function keys.
  mac?: string;
  description: string;
  // CodeMirror 6 key identifiers bound to this action, when it is an editor
  // shortcut — several combos may share one action. CM6 spelling: single
  // letters are lowercase, Escape is spelled out, and Mod- is Cmd on macOS
  // and Ctrl everywhere else.
  keys?: string[];
  // Handler id CodeEditor resolves into a CodeMirror command or callback.
  action?: string;
}

export interface ShortcutGroup {
  // Matches the group of the shortcuts listed under it.
  id: string;
  title: string;
  note: string;
  Icon: () => React.JSX.Element;
}

export interface FeatureManifest {
  // The feature's folder name, which is also how other features refer to it.
  id: string;
  // Route the page lives at. A feature without one (Chat Ops) only adds to the shell.
  path?: string;
  page?: LazyExoticComponent<ComponentType>;
  // Entry in the navigation, the palette's "Go to" group and the dashboard's guide.
  nav?: {
    label: string;
    Icon: () => React.JSX.Element;
    // Shown on the dashboard's guide. The Dashboard itself needs no description.
    description?: string;
    // Position in the navigation; lower comes first.
    order: number;
  };
  // A page made of lists and tables, which the layout narrows on very wide screens.
  roomy?: boolean;
  palette?: {
    links?: PaletteLink[];
    // Loaded the first time the palette opens per backend; failures contribute nothing.
    entries?: () => Promise<PaletteEntry[]>;
  };
  // Entries in a group of the feature's own, or in a core group such as 'Global'.
  shortcuts?: { group?: ShortcutGroup; entries: Shortcut[] };
  // Mounted inside the layout for as long as it is, whatever page is showing.
  shell?: ComponentType;
}

let registered: FeatureManifest[] = [];

export function registerFeatures(features: FeatureManifest[]) {
  const ids = new Set<string>();
  for (const feature of features) {
    if (ids.has(feature.id)) {
      throw new Error(`Feature "${feature.id}" is registered twice`);
    }
    ids.add(feature.id);
  }
  registered = [...features].sort(
    (a, b) => (a.nav?.order ?? Number.MAX_SAFE_INTEGER) - (b.nav?.order ?? Number.MAX_SAFE_INTEGER),
  );
}

// Every registered feature, in navigation order.
export function features(): readonly FeatureManifest[] {
  return registered;
}

export function hasFeature(id: string) {
  return registered.some(feature => feature.id === id);
}

/*
 * The address of another feature's page, with an optional suffix ('?filter=x'), or null when
 * that feature is not in this build. Callers render no link for null.
 */
export function featureHref(id: string, suffix = ''): string | null {
  const path = registered.find(feature => feature.id === id)?.path;
  return path === undefined ? null : path + suffix;
}
