/*
 * The single source of truth for keyboard shortcuts. CodeEditor builds its
 * CodeMirror keymap FROM this list, and the shortcuts overlay renders it —
 * so a binding cannot exist without being documented, and vice versa.
 *
 * The docs table on the Hyper IDE documentation page mirrors this list —
 * update it when this changes.
 */

export interface Shortcut {
  group: 'Global' | 'Editor' | 'Hyper IDE';
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
    display: 'Ctrl + .',
    mac: 'Cmd + .',
    description: 'Toggle Chat Ops — talk to your cloudlet (requires an OpenAI API key)',
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
  {
    group: 'Hyper IDE',
    display: 'Alt + A',
    mac: 'Opt + A',
    description: 'New file',
    keys: ['Alt-a'],
    action: 'newFile',
  },
  {
    group: 'Hyper IDE',
    display: 'Alt + B',
    mac: 'Opt + B',
    description: 'New folder',
    keys: ['Alt-b'],
    action: 'newFolder',
  },
  {
    group: 'Hyper IDE',
    display: 'Alt + R',
    mac: 'Opt + R',
    description: 'Rename the open file',
    keys: ['Alt-r'],
    action: 'renameFile',
  },
  {
    group: 'Hyper IDE',
    display: 'Alt + D',
    mac: 'Opt + D',
    description: 'Delete the open file',
    keys: ['Alt-d'],
    action: 'deleteFile',
  },
  {
    group: 'Hyper IDE',
    display: 'Alt + X',
    mac: 'Opt + X',
    description: 'Delete the active folder',
    keys: ['Alt-x'],
    action: 'deleteFolder',
  },
  {
    group: 'Hyper IDE',
    display: 'Alt + C',
    mac: 'Opt + C',
    description: 'Close the open file',
    keys: ['Alt-c'],
    action: 'close',
  },
  /*
   * Not Ctrl+Tab, even though CodeMirror binds it happily (its keyNames maps
   * keyCode 9 to "Tab"): Chrome has reserved Ctrl+Tab for its own tab cycling
   * since Chrome 4 and never delivers it to the page, and Ctrl+PageUp,
   * Ctrl+PageDown and Ctrl+1..9 are gone for the same reason. Only the
   * fullscreen-only Keyboard Lock API can claim those back.
   *
   * And not Alt+N for "next", which is the obvious pick: on macOS Option+N is
   * the tilde dead key — like Option+E, I, U and ` — so the OS swallows the
   * keystroke waiting for the character to accent. F for "forward" instead.
   */
  {
    group: 'Hyper IDE',
    display: 'Alt + F',
    mac: 'Opt + F',
    description: 'Switch to the next open file',
    keys: ['Alt-f'],
    action: 'nextTab',
  },
  {
    group: 'Hyper IDE',
    display: 'Alt + P',
    mac: 'Opt + P',
    description: 'Switch to the previous open file',
    keys: ['Alt-p'],
    action: 'previousTab',
  },
];

// macOS reports as Mac (or an iDevice) — decides which combo to display.
export const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

export function shortcutDisplay(shortcut: Shortcut): string {
  return isMac && shortcut.mac ? shortcut.mac : shortcut.display;
}
