/*
 * Unit tests for SQL Studio's result helpers — cell formatting, GO batch
 * detection and the post-run toast. Node environment only.
 */

import { isValidElement, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import {
  countRecords,
  executionMessage,
  formatCell,
  isGoBatch,
  MAX_RENDERED_ROWS,
} from '../results';

describe('formatCell', () => {
  it('renders null and undefined as a muted "null" span', () => {
    for (const value of [null, undefined]) {
      const cell = formatCell(value);
      expect(isValidElement(cell)).toBe(true);
      const element = cell as ReactElement<{ className: string; children: string }>;
      expect(element.type).toBe('span');
      expect(element.props.className).toBe('muted');
      expect(element.props.children).toBe('null');
    }
  });

  it('stringifies booleans', () => {
    expect(formatCell(true)).toBe('true');
    expect(formatCell(false)).toBe('false');
  });

  it('stringifies numbers, including zero', () => {
    expect(formatCell(42)).toBe('42');
    expect(formatCell(0)).toBe('0');
    expect(formatCell(-1.5)).toBe('-1.5');
  });

  it('passes strings through, including the empty string', () => {
    expect(formatCell('hello')).toBe('hello');
    expect(formatCell('')).toBe('');
  });

  it('JSON-encodes objects and arrays', () => {
    expect(formatCell({ a: 1, b: 'x' })).toBe('{"a":1,"b":"x"}');
    expect(formatCell([1, 2])).toBe('[1,2]');
  });

  it('JSON-encodes dates as their ISO string in quotes', () => {
    expect(formatCell(new Date('2024-01-02T03:04:05.000Z'))).toBe('"2024-01-02T03:04:05.000Z"');
  });
});

describe('MAX_RENDERED_ROWS', () => {
  it('caps the DOM at 1000 rows', () => {
    expect(MAX_RENDERED_ROWS).toBe(1000);
  });
});

describe('isGoBatch', () => {
  it('is true for mssql with a line that is only GO', () => {
    expect(isGoBatch('mssql', 'select 1\ngo\nselect 2')).toBe(true);
    expect(isGoBatch('mssql', 'select 1\n  GO ;  \nselect 2')).toBe(true);
  });

  it('ignores words that merely contain "go"', () => {
    expect(isGoBatch('mssql', 'select category, algorithm from things')).toBe(false);
    expect(isGoBatch('mssql', 'select 1 go')).toBe(false);
  });

  it('is false for every other database type', () => {
    expect(isGoBatch('mysql', 'select 1\ngo')).toBe(false);
    expect(isGoBatch('sqlite', 'go')).toBe(false);
  });
});

describe('countRecords', () => {
  it('sums rows across result sets', () => {
    expect(countRecords([[{ a: 1 }, { a: 2 }], [{ b: 1 }]])).toBe(3);
  });

  it('is zero for null and for empty sets', () => {
    expect(countRecords(null)).toBe(0);
    expect(countRecords([])).toBe(0);
    expect(countRecords([[]])).toBe(0);
  });
});

describe('executionMessage', () => {
  it('reports the record count', () => {
    expect(executionMessage([[{ a: 1 }]], 1, true)).toBe('1 records returned');
  });

  it('reports no result for a null response', () => {
    expect(executionMessage(null, 0, true)).toBe('SQL executed successfully, no result');
  });

  it('warns about the safe-mode cap at exactly 200 records', () => {
    expect(executionMessage([], 200, true)).toBe(
      'First 200 records returned. Turn off safe mode to return all records.',
    );
    expect(executionMessage([], 200, false)).toBe('200 records returned');
    expect(executionMessage([], 201, true)).toBe('201 records returned');
  });
});
