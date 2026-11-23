/*
 * Unit tests for SQL Studio's history (de)serialisation and ordering.
 * Node environment only — sessionStorage is not touched here.
 */

import { describe, expect, it } from 'vitest';

import {
  addToHistory,
  HISTORY_LIMIT,
  historyLabel,
  parseHistory,
  serializeHistory,
} from '../history';

describe('parseHistory', () => {
  it('is empty when nothing is stored', () => {
    expect(parseHistory(null)).toEqual([]);
  });

  it('is empty when the stored value is not JSON', () => {
    expect(parseHistory('{not json')).toEqual([]);
  });

  it('round-trips what serializeHistory wrote', () => {
    const history = [{ sql: 'select 1', when: '2024-01-01T00:00:00.000Z' }];
    expect(parseHistory(serializeHistory(history))).toEqual(history);
  });

  it('returns valid JSON as-is, without checking its shape', () => {
    // Today a stored "null" or object comes back unvalidated (see report).
    expect(parseHistory('null')).toBeNull();
    expect(parseHistory('{"a":1}')).toEqual({ a: 1 });
  });
});

describe('addToHistory', () => {
  it('puts the new statement first', () => {
    const next = addToHistory([{ sql: 'a', when: '1' }], 'b', '2');
    expect(next).toEqual([
      { sql: 'b', when: '2' },
      { sql: 'a', when: '1' },
    ]);
  });

  it('moves a re-run statement to the top instead of duplicating it', () => {
    const current = [
      { sql: 'a', when: '1' },
      { sql: 'b', when: '2' },
    ];
    expect(addToHistory(current, 'b', '3')).toEqual([
      { sql: 'b', when: '3' },
      { sql: 'a', when: '1' },
    ]);
  });

  it('keeps at most 20 entries, dropping the oldest', () => {
    const current = Array.from({ length: HISTORY_LIMIT }, (_, i) => ({
      sql: 'q' + i,
      when: String(i),
    }));
    const next = addToHistory(current, 'new', 'x');
    expect(HISTORY_LIMIT).toBe(20);
    expect(next).toHaveLength(20);
    expect(next[0].sql).toBe('new');
    expect(next[19].sql).toBe('q18');
  });

  it('does not mutate the current list', () => {
    const current = [{ sql: 'a', when: '1' }];
    addToHistory(current, 'b', '2');
    expect(current).toEqual([{ sql: 'a', when: '1' }]);
  });
});

describe('historyLabel', () => {
  it('shows local HH:MM and the statement collapsed onto one line', () => {
    const when = new Date(2024, 0, 2, 9, 7, 0).toISOString();
    expect(historyLabel({ sql: 'select *\n  from\tusers', when })).toBe(
      '09:07 — select * from users',
    );
  });

  it('cuts the statement at 60 characters', () => {
    const when = new Date(2024, 0, 2, 13, 45).toISOString();
    const label = historyLabel({ sql: 'x'.repeat(100), when });
    expect(label).toBe('13:45 — ' + 'x'.repeat(60));
  });
});
