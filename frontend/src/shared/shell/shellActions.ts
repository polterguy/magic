/*
 * What the layout shell can do on behalf of the pages below it, and what features add to it.
 *
 * Pages render as Layout's children rather than below it in the tree, so they cannot reach its
 * state through props. Whoever owns an action registers it here and anything can raise it, the
 * same way toasts and nav guards work. An action nobody registered is a no-op — the Chat Ops
 * feature may not be part of the build at all.
 *
 * Features also contribute palette actions and footer buttons while they are mounted (the
 * dashboard's tour, the Chat Ops button), which the layout renders from the lists here.
 */
import { useSyncExternalStore } from 'react';

type ShellAction = 'openPalette' | 'openChatOps' | 'refreshChat';

const actions = new Map<ShellAction, () => void>();

// Registers the handler for an action, and returns what unregisters it again.
export function registerShellAction(name: ShellAction, handler: () => void) {
  actions.set(name, handler);
  return () => {
    if (actions.get(name) === handler) {
      actions.delete(name);
    }
  };
}

export function openPalette() {
  actions.get('openPalette')?.();
}

export function openChatOps() {
  actions.get('openChatOps')?.();
}

// Chat Ops only exists with an OpenAI key, so whoever changes the key says so here.
export function refreshChat() {
  actions.get('refreshChat')?.();
}

export interface PaletteAction {
  label: string;
  action: () => void;
}

export interface FooterAction {
  id: string;
  title: string;
  Icon: () => React.JSX.Element;
  onClick: () => void;
}

interface Contributions {
  paletteActions: readonly PaletteAction[];
  footerActions: readonly FooterAction[];
}

let contributions: Contributions = { paletteActions: [], footerActions: [] };
const subscribers = new Set<() => void>();

function update(next: Contributions) {
  contributions = next;
  subscribers.forEach(subscriber => subscriber());
}

function subscribe(subscriber: () => void) {
  subscribers.add(subscriber);
  return () => {
    subscribers.delete(subscriber);
  };
}

// Adds an entry to the palette's actions for as long as the returned function is not called.
export function addPaletteAction(entry: PaletteAction) {
  update({ ...contributions, paletteActions: [...contributions.paletteActions, entry] });
  return () =>
    update({
      ...contributions,
      paletteActions: contributions.paletteActions.filter(existing => existing !== entry),
    });
}

// Adds a button to the sidebar footer, ahead of the layout's own, until removed again.
export function addFooterAction(entry: FooterAction) {
  update({ ...contributions, footerActions: [...contributions.footerActions, entry] });
  return () =>
    update({
      ...contributions,
      footerActions: contributions.footerActions.filter(existing => existing !== entry),
    });
}

// What features contribute right now; components use useShellContributions to follow changes.
export function shellContributions(): Contributions {
  return contributions;
}

export function useShellContributions(): Contributions {
  return useSyncExternalStore(subscribe, () => contributions);
}
