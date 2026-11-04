/*
 * Pure helpers for SQL Studio's result sets — how many rows reach the DOM,
 * how a cell renders, and what the toast says after a run.
 */

import { createElement, type ReactNode } from 'react';

import type { SqlRow } from '../../lib/api';

/*
 * With safe mode off a query can answer with hundreds of thousands of rows,
 * and rendering them all freezes the tab — the data is all still there for
 * the CSV export, only the DOM is capped.
 */
export const MAX_RENDERED_ROWS = 1000;

export function formatCell(value: unknown): ReactNode {
  const text = cellText(value);
  return text ?? createElement('span', { className: 'muted' }, 'null');
}

// A cell's text, or null for a SQL NULL.
function cellText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  // A JSON result cell: what is left is a string, number or boolean.
  const scalar = value as string | number | boolean;
  return String(scalar);
}

/*
 * Batch mode only when a line actually IS a GO statement — merely
 * containing the letters "go" (category, algorithm…) doesn't count.
 */
export function isGoBatch(type: string, sql: string) {
  return type === 'mssql' && /^[ \t]*go(?:[ \t]*;)?[ \t]*$/im.test(sql);
}

// Total number of records across every result set of one execution.
export function countRecords(response: SqlRow[][] | null) {
  return (response ?? []).reduce((total, set) => total + (set?.length ?? 0), 0);
}

// The toast shown after a successful execution.
export function executionMessage(response: SqlRow[][] | null, count: number, safeMode: boolean) {
  let message = count + ' records returned';
  if (response === null) {
    message = 'SQL executed successfully, no result';
  } else if (count === 200 && safeMode) {
    message = 'First 200 records returned. Turn off safe mode to return all records.';
  }
  return message;
}
