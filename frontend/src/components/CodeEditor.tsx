/*
 * CodeMirror 5 wrapper. Supports the custom Hyperlambda mode ported from
 * the Angular dashboard, plus SQL and JSON out of the box.
 */

import { useEffect, useRef } from 'react';
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/display/fullscreen.js';
import 'codemirror/addon/display/fullscreen.css';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/hint/sql-hint.js';
import 'codemirror/addon/dialog/dialog.js';
import 'codemirror/addon/dialog/dialog.css';
import 'codemirror/addon/search/searchcursor.js';
import 'codemirror/addon/search/search.js';
import 'codemirror/mode/sql/sql';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/css/css';
import 'codemirror/mode/markdown/markdown';
import defineHyperlambda from '../resources/hyperlambda.js';
import '../resources/ainiro.css';
import { http, apiBaseUrl } from '../lib/api.js';
import { SHORTCUTS } from '../lib/shortcuts';

defineHyperlambda(CodeMirror);

/*
 * The hyperlambda mode colors slot invocations from window._vocabulary,
 * so the vocabulary must be loaded before an editor is created.
 *
 * Cached per backend rather than once: two cloudlets run different plugins,
 * so they know different slots, and keeping the first one's vocabulary would
 * mis-colour the second one's code.
 */
let vocabularyPromise: Promise<void> | null = null;
let vocabularyFrom: string | null = null;

/*
 * Slot name → description, powering hover-docs in Hyperlambda editors.
 * Fetched alongside the vocabulary but deliberately NOT part of its promise:
 * an older backend without the endpoint just means no hover-docs, never a
 * broken editor.
 */
let slotDocs: Record<string, string | null> = {};

function ensureVocabulary() {
  if (vocabularyFrom !== apiBaseUrl()) {
    vocabularyPromise = null;
    slotDocs = {};
    delete (window as any)._vocabulary;
    delete (window as any)._slots;
  }
  if ((window as any)._vocabulary) {
    return Promise.resolve();
  }
  vocabularyFrom = apiBaseUrl();
  http.get<Record<string, string | null>>('/magic/system/evaluator/vocabulary-verbose')
    .then(docs => { slotDocs = docs ?? {}; })
    .catch(() => { slotDocs = {}; });
  vocabularyPromise ??= Promise.all([
    http.get<string[]>('/magic/system/evaluator/vocabulary'),
    http.get<string[]>('/magic/system/evaluator/slots'),
  ]).then(([vocabulary, slots]) => {
    (window as any)._vocabulary = vocabulary;
    // The hint helper reads _slots to offer [execute:...] completions
    // for dynamic slots.
    (window as any)._slots = slots;
  }).catch(err => {
    // A failed fetch must not stay cached, or highlighting silently stays
    // broken until reload — clearing lets the next editor mount try again.
    vocabularyPromise = null;
    vocabularyFrom = null;
    throw err;
  });
  return vocabularyPromise;
}

/*
 * The hover-doc tooltip — one shared element for every editor on the page,
 * shown when the pointer rests on a token the vocabulary knows.
 */
let slotDocTip: HTMLDivElement | null = null;

function showSlotDoc(anchor: HTMLElement, name: string, description: string) {
  if (!slotDocTip) {
    slotDocTip = document.createElement('div');
    slotDocTip.className = 'slot-doc';
    document.body.appendChild(slotDocTip);
  }
  slotDocTip.innerHTML = '';
  const title = document.createElement('div');
  title.className = 'slot-doc-name';
  title.textContent = '[' + name + ']';
  const body = document.createElement('div');
  body.textContent = description;
  slotDocTip.append(title, body);
  const rect = anchor.getBoundingClientRect();
  slotDocTip.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - 340)) + 'px';
  slotDocTip.style.top = (rect.bottom + 6) + 'px';
  slotDocTip.style.display = 'block';
}

function hideSlotDoc() {
  if (slotDocTip) {
    slotDocTip.style.display = 'none';
  }
}

/*
 * Wires hover-docs onto an editor: resting the pointer on a slot invocation
 * shows what the slot does, using the descriptions the backend declares.
 * Slot tokens render as cm-keyword (dotless names) or cm-variable-2 (dotted).
 */
function attachSlotDocs(wrapper: HTMLElement) {
  wrapper.addEventListener('mouseover', event => {
    const target = event.target as HTMLElement;
    if (!target.classList ||
        (!target.classList.contains('cm-keyword') && !target.classList.contains('cm-variable-2'))) {
      hideSlotDoc();
      return;
    }
    const name = (target.textContent ?? '').trim();
    const description = slotDocs[name];
    if (description) {
      showSlotDoc(target, name, description);
    } else {
      hideSlotDoc();
    }
  });
  wrapper.addEventListener('mouseleave', hideSlotDoc);
}

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  mode: string;
  readOnly?: boolean;
  height?: string;
  onSave?: () => void;
  onExecute?: () => void;
  /*
   * F1 — asks the support chatbot about the selection. Only wired up for
   * Hyperlambda, so it is the caller that decides whether it applies.
   */
  onHelp?: (selection: string) => void;
  /*
   * Wraps long lines instead of scrolling sideways. Defaults to on for
   * markdown and off for everything else: prose has no meaningful line
   * breaks, so scrolling sideways to read a paragraph is nonsense, while
   * code reads better unwrapped.
   */
  lineWrapping?: boolean;
  // Table → columns map feeding SQL autocomplete.
  hintTables?: Record<string, string[]>;
  // Gives the parent access to the CodeMirror instance (selection etc.).
  onInstance?: (instance: CodeMirror.Editor) => void;
  // Old-dashboard Alt-key actions: newFile, newFolder, renameFile,
  // deleteFile, deleteFolder, close.
  onAction?: (action: string) => void;
}

export default function CodeEditor(props: CodeEditorProps) {

  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<CodeMirror.Editor | null>(null);
  const callbacks = useRef(props);
  callbacks.current = props;

  useEffect(() => {
    let cancelled = false;
    ensureVocabulary()
      .catch(error => console.error('Could not load Hyperlambda vocabulary:', error))
      .then(() => {
        if (cancelled) {
          return;
        }
        createEditor();
      });

    /*
     * The keymap is built from the shared shortcut registry, so every
     * binding is documented in the shortcuts overlay by construction. This
     * table resolves the registry's action ids into what CodeMirror runs —
     * a named command or a callback.
     *
     * Notes that shaped some of these: search is `findPersistent` so every
     * match stays highlighted while the dialog is up (Enter cycles, Escape
     * closes). Tab indents the SELECTION as a block — indentUnit is 3, so a
     * level is Hyperlambda's three spaces — and just types the spaces
     * without one; insertSoftTab on a selection would have replaced the
     * code with spaces rather than indenting it.
     */
    const handlers: Record<string, string | ((cm: CodeMirror.Editor) => void)> = {
      autocomplete: 'autocomplete',
      findPersistent: 'findPersistent',
      fullscreen: cm => cm.setOption('fullScreen', !cm.getOption('fullScreen')),
      exitFullscreen: cm => {
        if (cm.getOption('fullScreen')) {
          cm.setOption('fullScreen', false);
        }
      },
      indent: cm => cm.execCommand(cm.somethingSelected() ? 'indentMore' : 'insertSoftTab'),
      outdent: cm => cm.execCommand('indentLess'),
      save: () => callbacks.current.onSave?.(),
      execute: () => callbacks.current.onExecute?.(),
      help: cm => callbacks.current.onHelp?.(cm.getSelection()),
      newFile: () => callbacks.current.onAction?.('newFile'),
      newFolder: () => callbacks.current.onAction?.('newFolder'),
      renameFile: () => callbacks.current.onAction?.('renameFile'),
      deleteFile: () => callbacks.current.onAction?.('deleteFile'),
      deleteFolder: () => callbacks.current.onAction?.('deleteFolder'),
      close: () => callbacks.current.onAction?.('close'),
    };
    const extraKeys: Record<string, string | ((cm: CodeMirror.Editor) => void)> = {};
    for (const shortcut of SHORTCUTS) {
      if (!shortcut.action || !shortcut.keys) {
        continue;
      }
      for (const key of shortcut.keys) {
        extraKeys[key] = handlers[shortcut.action];
      }
    }

    function createEditor() {
    const instance = CodeMirror(host.current!, {
      value: callbacks.current.value,
      mode: callbacks.current.mode,
      theme: 'ainiro',
      lineNumbers: true,
      readOnly: callbacks.current.readOnly ?? false,
      lineWrapping: callbacks.current.lineWrapping ?? wrapsByDefault(callbacks.current.mode),
      tabSize: 3,
      indentUnit: 3,
      indentWithTabs: false,
      extraKeys,
    });
    instance.setSize('100%', callbacks.current.height ?? '100%');
    if (callbacks.current.hintTables) {
      instance.setOption(
        'hintOptions' as any,
        { tables: callbacks.current.hintTables, completeSingle: false });
    }
    callbacks.current.onInstance?.(instance);
    if (callbacks.current.mode === 'hyperlambda') {
      attachSlotDocs(instance.getWrapperElement());
    }
    instance.on('change', (_, change) => {
      // Programmatic setValue (e.g. opening a file) is not a user edit.
      if (change.origin === 'setValue') {
        return;
      }
      callbacks.current.onChange?.(instance.getValue());
    });
    editor.current = instance;
    }

    return () => {
      cancelled = true;
      host.current?.replaceChildren();
      editor.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = editor.current;
    if (instance && props.value !== instance.getValue()) {
      instance.setValue(props.value);
    }
  }, [props.value]);

  useEffect(() => {
    editor.current?.setOption('readOnly', props.readOnly ?? false);
  }, [props.readOnly]);

  useEffect(() => {
    editor.current?.setOption('mode', props.mode);
    editor.current?.setOption(
      'lineWrapping', props.lineWrapping ?? wrapsByDefault(props.mode));
  }, [props.mode, props.lineWrapping]);

  useEffect(() => {
    if (props.hintTables) {
      editor.current?.setOption(
        'hintOptions' as any,
        { tables: props.hintTables, completeSingle: false });
    }
  }, [props.hintTables]);

  return <div className="code-editor" ref={host} />;
}

// Markdown is prose, and prose wraps.
function wrapsByDefault(mode: string) {
  return mode === 'markdown';
}

/*
 * Returns the CodeMirror mode to use for the given filename.
 */
export function modeForFile(filename: string): string {
  const extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
  switch (extension) {
    case 'hl': return 'hyperlambda';
    case 'sql': return 'text/x-sql';
    case 'js': case 'ts': return 'javascript';
    case 'json': return 'application/json';
    case 'html': case 'htm': return 'htmlmixed';
    case 'css': case 'scss': return 'css';
    case 'md': return 'markdown';
    default: return 'text/plain';
  }
}
