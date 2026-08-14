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
  // CodeMirror key identifiers bound to this action, when it is an editor
  // shortcut — several combos may share one action.
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
    keys: ['Ctrl-F', 'Cmd-F'],
    action: 'findPersistent',
  },
  {
    group: 'Editor',
    display: 'Alt + M',
    mac: 'Opt + M',
    description: 'Toggle fullscreen editing — Esc leaves fullscreen',
    keys: ['Alt-M'],
    action: 'fullscreen',
  },
  {
    group: 'Editor',
    display: 'Esc',
    description: 'Leave fullscreen editing',
    keys: ['Esc'],
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
    keys: ['Alt-S', 'Ctrl-S', 'Cmd-S'],
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
    keys: ['Alt-A'],
    action: 'newFile',
  },
  {
    group: 'Hyper IDE',
    display: 'Alt + B',
    mac: 'Opt + B',
    description: 'New folder',
    keys: ['Alt-B'],
    action: 'newFolder',
  },
  {
    group: 'Hyper IDE',
    display: 'Alt + R',
    mac: 'Opt + R',
    description: 'Rename the open file',
    keys: ['Alt-R'],
    action: 'renameFile',
  },
  {
    group: 'Hyper IDE',
    display: 'Alt + D',
    mac: 'Opt + D',
    description: 'Delete the open file',
    keys: ['Alt-D'],
    action: 'deleteFile',
  },
  {
    group: 'Hyper IDE',
    display: 'Alt + X',
    mac: 'Opt + X',
    description: 'Delete the active folder',
    keys: ['Alt-X'],
    action: 'deleteFolder',
  },
  {
    group: 'Hyper IDE',
    display: 'Alt + C',
    mac: 'Opt + C',
    description: 'Close the open file',
    keys: ['Alt-C'],
    action: 'close',
  },
];

// macOS reports as Mac (or an iDevice) — decides which combo to display.
export const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

export function shortcutDisplay(shortcut: Shortcut): string {
  return isMac && shortcut.mac ? shortcut.mac : shortcut.display;
}
