/*
 * SQL Studio's execution history — the last 20 executed statements, newest
 * first — failures included, since the query you want back is often the one
 * that just broke. Session-scoped: a scratch log, not a snippet collection.
 */

export interface HistoryEntry {
  sql: string;
  when: string;
}

export const HISTORY_KEY = 'magic2.sql-studio.history';
export const HISTORY_LIMIT = 20;

// Reads the serialised history back, falling back to empty when it is unreadable.
export function parseHistory(raw: string | null): HistoryEntry[] {
  try {
    return JSON.parse(raw ?? '[]') as HistoryEntry[];
  } catch {
    return [];
  }
}

export function serializeHistory(history: HistoryEntry[]) {
  return JSON.stringify(history);
}

// Re-running a statement moves it to the top instead of duplicating it.
export function addToHistory(current: HistoryEntry[], statement: string, when: string) {
  return [{ sql: statement, when }, ...current.filter(entry => entry.sql !== statement)].slice(
    0,
    HISTORY_LIMIT,
  );
}

// The History… dropdown's label — local HH:MM, then the statement on one line.
export function historyLabel(entry: HistoryEntry) {
  return (
    new Date(entry.when).toTimeString().substring(0, 5) +
    ' — ' +
    entry.sql.replace(/\s+/g, ' ').substring(0, 60)
  );
}
