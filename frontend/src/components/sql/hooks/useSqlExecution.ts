import type { EditorView } from '@codemirror/view';
import { type RefObject, useState } from 'react';

import { executeSql, type SqlRow } from '../../../lib/api';
import { editorSelection } from '../../../lib/editor';
import { showError } from '../../../lib/errors';
import { showToast } from '../../../lib/toast';
import { countRecords, executionMessage, isGoBatch } from '../results';

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

  async function execute() {
    const selected = editorSelection(editorRef.current);
    const toExecute = selected !== '' ? selected : sql;
    if (!toExecute.trim()) {
      showToast('Write some SQL first', true);
      return;
    }
    pushHistory(toExecute);
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
      setBusy(false);
    }
  }

  return { safeMode, setSafeMode, result, busy, execute };
}
