/*
 * CodeMirror 5 wrapper. Supports the custom Hyperlambda mode ported from
 * the Angular dashboard, plus SQL and JSON out of the box.
 */

import { useEffect, useRef } from 'react';
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/sql/sql';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/css/css';
import 'codemirror/mode/markdown/markdown';
import defineHyperlambda from '../resources/hyperlambda.js';
import '../resources/ainiro.css';

defineHyperlambda(CodeMirror);

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  mode: string;
  readOnly?: boolean;
  height?: string;
  onSave?: () => void;
  onExecute?: () => void;
}

export default function CodeEditor(props: CodeEditorProps) {

  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<CodeMirror.Editor | null>(null);
  const callbacks = useRef(props);
  callbacks.current = props;

  useEffect(() => {
    const instance = CodeMirror(host.current!, {
      value: props.value,
      mode: props.mode,
      theme: 'ainiro',
      lineNumbers: true,
      tabSize: 3,
      indentUnit: 3,
      indentWithTabs: false,
      extraKeys: {
        'Ctrl-S': () => callbacks.current.onSave?.(),
        'Cmd-S': () => callbacks.current.onSave?.(),
        F5: () => callbacks.current.onExecute?.(),
        Tab: (cm: CodeMirror.Editor) => cm.execCommand('insertSoftTab'),
      },
    });
    instance.setSize('100%', callbacks.current.height ?? '100%');
    instance.on('change', () => {
      callbacks.current.onChange?.(instance.getValue());
    });
    editor.current = instance;
    return () => {
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
