/*
 * Web Designer's canvas shortcuts.
 * They reach the shortcuts overlay (and, for editor bindings, the editor's keymap) through this
 * feature's manifest.
 */
import type { Shortcut } from '@shared/shell/shortcuts';

export const DESIGNER_SHORTCUTS: Shortcut[] = [
  /*
   * Web Designer binds these on the page itself rather than through a
   * CodeMirror keymap, and they fire inside the canvas frame too — the frame
   * is same-origin, so its key events are handled by the very same listener.
   */
  {
    group: 'Web Designer',
    display: 'Delete',
    description: 'Remove the selected element',
  },
  {
    group: 'Web Designer',
    display: 'Esc',
    description: 'Deselect',
  },
  {
    group: 'Web Designer',
    display: 'Ctrl + C',
    mac: 'Cmd + C',
    description: 'Copy the selected element or run of text',
  },
  {
    group: 'Web Designer',
    display: 'Ctrl + X',
    mac: 'Cmd + X',
    description: 'Cut the selection',
  },
  {
    group: 'Web Designer',
    display: 'Ctrl + V',
    mac: 'Cmd + V',
    description: 'Paste after the selection, or inside it when it is empty',
  },
  {
    group: 'Web Designer',
    display: 'Ctrl + Z',
    mac: 'Cmd + Z',
    description: 'Undo the last design change',
  },
  {
    group: 'Web Designer',
    display: 'Ctrl + Shift + Z',
    mac: 'Cmd + Shift + Z',
    description: 'Redo the change that was undone',
  },
  {
    group: 'Web Designer',
    display: 'Ctrl + S',
    mac: 'Cmd + S',
    description: 'Save the page, and its stylesheet when it changed',
  },
  {
    group: 'Web Designer',
    display: 'Double click',
    description: 'Edit the text of an element that holds nothing but text',
  },
];
