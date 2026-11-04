import { useState } from 'react';
import {
  HISTORY_KEY,
  type HistoryEntry,
  addToHistory,
  parseHistory,
  serializeHistory,
} from '../history';

/*
 * The last 20 executed statements, newest first — failures included, since
 * the query you want back is often the one that just broke. Session-scoped:
 * a scratch log, not a snippet collection.
 */
export function useSqlHistory(setSql: (sql: string) => void, bumpSqlEditId: () => void) {
  const [history, setHistory] = useState<HistoryEntry[]>(() =>
    parseHistory(sessionStorage.getItem(HISTORY_KEY)),
  );

  function pushHistory(statement: string) {
    setHistory(current => {
      // Re-running a statement moves it to the top instead of duplicating it.
      const next = addToHistory(current, statement, new Date().toISOString());
      sessionStorage.setItem(HISTORY_KEY, serializeHistory(next));
      return next;
    });
  }

  /*
   * No discard-confirmation here, unlike snippets: everything in history was
   * executed, so the statement being replaced is either already in history
   * itself or a few keystrokes of scratch — the dialog would cost more than
   * the loss it prevents.
   */
  function openHistory(index: number) {
    const entry = history[index];
    if (entry) {
      setSql(entry.sql);
      bumpSqlEditId();
    }
  }

  return { history, pushHistory, openHistory };
}
