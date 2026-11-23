/*
 * The single source of truth for keyboard shortcuts. CodeEditor builds its
 * CodeMirror keymap FROM these lists, and the shortcuts overlay renders them —
 * so a binding cannot exist without being documented, and vice versa.
 *
 * The shortcuts that work everywhere live here. A feature's own shortcuts live
 * in its folder and reach this list through its manifest, so they leave with it.
 *
 * The docs table on the Hyper IDE documentation page mirrors these lists —
 * update it when they change.
 */
import { features, type Shortcut } from './features';

export type { Shortcut } from './features';

export const SHORTCUTS: Shortcut[] = [
  {
    group: 'Global',
    display: 'Ctrl + K',
    mac: 'Cmd + K',
    description: 'Open the command palette — jump to any page, file, endpoint, task or model',
  },
  {
    group: 'Global',
    display: 'Ctrl + /',
    mac: 'Cmd + /',
    description: 'Show this keyboard shortcut overview',
  },
  {
    group: 'Global',
    display: 'Esc',
    description: 'Close the open dialog',
  },
  {
    group: 'Editor',
    display: 'Ctrl + Space',
    mac: 'Fn + Ctrl + Space',
    description: 'Autocomplete — Hyperlambda slots, SQL tables and columns',
    keys: ['Ctrl-Space'],
    action: 'autocomplete',
  },
  {
    group: 'Editor',
    display: 'Ctrl + F',
    mac: 'Cmd + F',
    description: 'Search inside the editor — Enter cycles matches, Esc closes',
    keys: ['Mod-f', 'Ctrl-f'],
    action: 'findPersistent',
  },
  {
    group: 'Editor',
    display: 'Alt + M',
    mac: 'Opt + M',
    description: 'Toggle fullscreen editing — Esc leaves fullscreen',
    keys: ['Alt-m'],
    action: 'fullscreen',
  },
  {
    group: 'Editor',
    display: 'Esc',
    description: 'Leave fullscreen editing',
    keys: ['Escape'],
    action: 'exitFullscreen',
  },
  {
    group: 'Editor',
    display: 'Tab',
    description: 'Indent the selection one level — without a selection, types the indentation',
    keys: ['Tab'],
    action: 'indent',
  },
  {
    group: 'Editor',
    display: 'Shift + Tab',
    description: 'Outdent the selection one level',
    keys: ['Shift-Tab'],
    action: 'outdent',
  },
  {
    group: 'Editor',
    display: 'Ctrl + S',
    mac: 'Cmd + S',
    description: 'Save the open file',
    keys: ['Alt-s', 'Mod-s', 'Ctrl-s'],
    action: 'save',
  },
  {
    group: 'Editor',
    display: 'F5',
    mac: 'Fn + F5',
    description: 'Execute — run the open file, snippet or SQL',
    keys: ['F5'],
    action: 'execute',
  },
  {
    group: 'Editor',
    display: 'F1',
    mac: 'Fn + F1',
    description: 'Ask the AI to explain the selected Hyperlambda',
    keys: ['F1'],
    action: 'help',
  },
];

/*
 * macOS reports as Mac (or an iDevice) — decides which combo to display.
 * Chromium names the platform through User-Agent Client Hints; the other
 * browsers only through the user agent string, which carries the same words.
 */
function detectMac() {
  if (typeof navigator === 'undefined') {
    return false;
  }
  const hinted = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
    ?.platform;
  // The client hint spells it "macOS"; the user agent "Macintosh", "iPhone" or "iPad".
  return hinted ? hinted === 'macOS' : /Mac|iPhone|iPad/.test(navigator.userAgent);
}

export const isMac = detectMac();

export function shortcutDisplay(shortcut: Shortcut): string {
  return isMac && shortcut.mac ? shortcut.mac : shortcut.display;
}

// The built-in shortcuts followed by those of every registered feature.
export function allShortcuts(): Shortcut[] {
  return [...SHORTCUTS, ...features().flatMap(feature => feature.shortcuts?.entries ?? [])];
}
