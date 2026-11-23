/*
 * Hyper IDE's file actions, bound in the code editor while it has focus.
 * They reach the shortcuts overlay (and, for editor bindings, the editor's keymap) through this
 * feature's manifest.
 */
import type { Shortcut } from '@core/shortcuts';

export const FILES_SHORTCUTS: Shortcut[] = [
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
