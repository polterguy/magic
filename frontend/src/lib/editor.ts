/*
 * Helpers that go with the CodeMirror wrapper (components/CodeEditor), kept
 * apart so that file exports only a component, as fast refresh wants.
 */

import type { EditorView } from '@codemirror/view';
import { useState } from 'react';

// The current selection's text, replacing CM5's getSelection().
export function editorSelection(view: EditorView | null): string {
  if (!view) {
    return '';
  }
  const range = view.state.selection.main;
  return view.state.sliceDoc(range.from, range.to);
}

/*
 * Pairs with CodeEditor's `undoableEditId`. Call bump() in the same handler that
 * sets the state driving a deliberate `value` replacement.
 */
export function useEditToken(): [number, () => void] {
  const [token, setToken] = useState(0);
  return [token, () => setToken(current => current + 1)];
}

/*
 * Returns the CodeMirror mode to use for the given filename.
 */
export function modeForFile(filename: string): string {
  const extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
  switch (extension) {
    case 'hl':
      return 'hyperlambda';
    case 'sql':
      return 'text/x-sql';
    case 'js':
    case 'ts':
      return 'javascript';
    case 'json':
      return 'application/json';
    case 'html':
    case 'htm':
      return 'htmlmixed';
    case 'css':
    case 'scss':
      return 'css';
    case 'md':
      return 'markdown';
    default:
      return 'text/plain';
  }
}
