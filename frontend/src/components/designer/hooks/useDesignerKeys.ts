/*
 * The designer's keyboard: delete, escape, and the copy, cut, paste, undo,
 * redo and save shortcuts — never while something is being typed into.
 */

import { useEffect } from 'react';

export function useDesignerKeys(o: {
  setSelected: (node: Node | null) => void;
  remove: () => void;
  copy: () => void;
  cut: () => void;
  paste: () => void;
  undo: () => void;
  redo: () => void;
  save: () => Promise<boolean>;
}) {
  const { setSelected, remove, copy, cut, paste, undo, redo, save } = o;

  /* -- Keyboard ----------------------------------------------------------- */

  function onKey(event: KeyboardEvent) {
    const from = event.target as HTMLElement | null;
    const tag = from?.tagName?.toLowerCase();
    // Never steal a key from something the user is typing into.
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || from?.isContentEditable) {
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      remove();
    } else if (event.key === 'Escape') {
      setSelected(null);
    } else if (event.metaKey || event.ctrlKey) {
      onShortcut(event);
    }
  }

  // Copy, cut, paste, undo, redo and save.
  function onShortcut(event: KeyboardEvent) {
    switch (event.key.toLowerCase()) {
      case 'c':
        event.preventDefault();
        copy();
        break;
      case 'x':
        event.preventDefault();
        cut();
        break;
      case 'v':
        event.preventDefault();
        paste();
        break;
      case 'z':
        event.preventDefault();
        // Shift is redo, as it is in every editor.
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        break;
      case 's':
        // Notice, only the lower case key saves.
        if (event.key === 's') {
          event.preventDefault();
          void save();
        }
        break;
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return onKey;
}
