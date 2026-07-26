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
import 'codemirror/mode/sql/sql';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/css/css';
import 'codemirror/mode/markdown/markdown';
import defineHyperlambda from '../resources/hyperlambda.js';
import '../resources/ainiro.css';
import { http } from '../lib/api.js';

defineHyperlambda(CodeMirror);

/*
 * The hyperlambda mode colors slot invocations from window._vocabulary,
 * so the vocabulary must be loaded before an editor is created.
 */
let vocabularyPromise: Promise<void> | null = null;

function ensureVocabulary() {
  if ((window as any)._vocabulary) {
    return Promise.resolve();
  }
  vocabularyPromise ??= Promise.all([
    http.get<string[]>('/magic/system/evaluator/vocabulary'),
    http.get<string[]>('/magic/system/evaluator/slots'),
  ]).then(([vocabulary, slots]) => {
    (window as any)._vocabulary = vocabulary;
    // The hint helper reads _slots to offer [execute:...] completions
    // for dynamic slots.
    (window as any)._slots = slots;
  });
  return vocabularyPromise;
}

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  mode: string;
  readOnly?: boolean;
  height?: string;
  onSave?: () => void;
  onExecute?: () => void;
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

    function createEditor() {
    const instance = CodeMirror(host.current!, {
      value: callbacks.current.value,
      mode: callbacks.current.mode,
      theme: 'ainiro',
      lineNumbers: true,
      readOnly: callbacks.current.readOnly ?? false,
      tabSize: 3,
      indentUnit: 3,
      indentWithTabs: false,
      // Same shortcut map as the old dashboard: Alt-M fullscreen,
      // Alt-S save, F5 execute. Ctrl-S/Cmd-S kept as aliases for save.
      extraKeys: {
        'Alt-M': (cm: CodeMirror.Editor) =>
          cm.setOption('fullScreen', !cm.getOption('fullScreen')),
        Esc: (cm: CodeMirror.Editor) => {
          if (cm.getOption('fullScreen')) {
            cm.setOption('fullScreen', false);
          }
        },
        'Ctrl-Space': 'autocomplete',
        'Alt-A': () => callbacks.current.onAction?.('newFile'),
        'Alt-B': () => callbacks.current.onAction?.('newFolder'),
        'Alt-R': () => callbacks.current.onAction?.('renameFile'),
        'Alt-D': () => callbacks.current.onAction?.('deleteFile'),
        'Alt-X': () => callbacks.current.onAction?.('deleteFolder'),
        'Alt-C': () => callbacks.current.onAction?.('close'),
        'Alt-S': () => callbacks.current.onSave?.(),
        'Ctrl-S': () => callbacks.current.onSave?.(),
        'Cmd-S': () => callbacks.current.onSave?.(),
        F5: () => callbacks.current.onExecute?.(),
        Tab: (cm: CodeMirror.Editor) => cm.execCommand('insertSoftTab'),
      },
    });
    instance.setSize('100%', callbacks.current.height ?? '100%');
    if (callbacks.current.hintTables) {
      instance.setOption(
        'hintOptions' as any,
        { tables: callbacks.current.hintTables, completeSingle: false });
    }
    callbacks.current.onInstance?.(instance);
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
  }, [props.mode]);

  useEffect(() => {
    if (props.hintTables) {
      editor.current?.setOption(
        'hintOptions' as any,
        { tables: props.hintTables, completeSingle: false });
    }
  }, [props.hintTables]);

  return <div className="code-editor" ref={host} />;
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
