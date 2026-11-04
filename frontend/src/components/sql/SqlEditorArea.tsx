import type { EditorView } from '@codemirror/view';
import type { RefObject } from 'react';

import { showToast } from '../../lib/toast';
import AiPrompt from '../AiPrompt';
import CodeEditor from '../CodeEditor';

/*
 * The SQL tab's editor and the AI prompt bar below it.
 */
export default function SqlEditorArea(
  props: Readonly<{
    sql: string;
    setSql: (sql: string) => void;
    sqlEditId: number;
    bumpSqlEditId: () => void;
    hintTables: Record<string, string[]>;
    editorRef: RefObject<EditorView | null>;
    onExecute: () => void;
    onSelectionChange: (hasSelection: boolean) => void;
    createAiContext: () => Promise<string>;
  }>,
) {
  const { sql, setSql, sqlEditId, bumpSqlEditId, hintTables, editorRef } = props;
  return (
    <>
      <div style={{ height: 260, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <CodeEditor
          value={sql}
          onChange={setSql}
          mode="text/x-sql"
          onExecute={props.onExecute}
          hintTables={hintTables}
          undoableEditId={sqlEditId}
          onInstance={instance => {
            if (editorRef.current === instance) {
              return;
            }
            editorRef.current = instance;
          }}
          onSelectionChange={props.onSelectionChange}
        />
      </div>
      <AiPrompt
        fileType="sql"
        getContext={props.createAiContext}
        session="sql-studio.editor"
        onResult={value => {
          setSql(value);
          bumpSqlEditId();
        }}
        onError={message => showToast(message, true)}
        style={{ marginTop: 8 }}
      />
    </>
  );
}
