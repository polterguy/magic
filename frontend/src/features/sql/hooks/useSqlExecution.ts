import type { EditorView } from '@codemirror/view';
import { editorSelection } from '@shared/lib/editor';
import { showError } from '@shared/lib/errors';
import { showToast } from '@shared/lib/toast';
import { type RefObject, useRef, useState } from 'react';

import { executeSql, type SqlRow } from '../lib/api';
import { countRecords, executionMessage, isGoBatch } from '../lib/results';

/*
 * Running the buffer — or just the selected fragment of it — and holding the
 * result sets of the last run.
 */
export function useSqlExecution(
  options: Readonly<{
    type: string;
    connectionString: string;
    database: string;
    sql: string;
    editorRef: RefObject<EditorView | null>;
    pushHistory: (statement: string) => void;
  }>,
) {
  const { type, connectionString, database, sql, editorRef, pushHistory } = options;
  const [safeMode, setSafeMode] = useState(true);
  const [result, setResult] = useState<SqlRow[][] | null>(null);
  const [busy, setBusy] = useState(false);
  // Guards against a second run while one is in flight — Ctrl+Enter in the
  // editor bypasses the disabled Run button. A ref, not [busy], so two calls
  // before the next render are still caught.
  const running = useRef(false);

  async function execute() {
    if (running.current) {
      return;
    }
    const selected = editorSelection(editorRef.current);
    const toExecute = selected === '' ? sql : selected;
    if (!toExecute.trim()) {
      showToast('Write some SQL first', true);
      return;
    }
    pushHistory(toExecute);
    running.current = true;
    setBusy(true);
    try {
      // Batch mode only when a line actually IS a GO statement — merely
      // containing the letters "go" (category, algorithm…) doesn't count.
      const batch = isGoBatch(type, toExecute);
      const response = await executeSql(
        type,
        '[' + connectionString + '|' + database + ']',
        toExecute,
        safeMode,
        batch,
      );
      setResult(response ?? []);
      const count = countRecords(response);
      showToast(executionMessage(response, count, safeMode));
    } catch (err) {
      showError(err);
      setResult(null);
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  return { safeMode, setSafeMode, result, busy, execute };
}
