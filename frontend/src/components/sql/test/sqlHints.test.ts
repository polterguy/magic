/*
 * Unit tests for sqlHintTables (lib/sql) — the table → columns map behind
 * Ctrl-Space SQL autocomplete.
 */

import { describe, expect, it } from 'vitest';

import { sqlHintTables } from '../../../lib/sql';

describe('sqlHintTables', () => {
  it('is empty without a selected database', () => {
    expect(sqlHintTables(undefined)).toEqual({});
  });

  it('is empty for a database without tables', () => {
    expect(sqlHintTables({ name: 'magic' })).toEqual({});
    expect(sqlHintTables({ name: 'magic', tables: null })).toEqual({});
    expect(sqlHintTables({ name: 'magic', tables: [] })).toEqual({});
  });

  it('maps each table to its column names, in order', () => {
    expect(
      sqlHintTables({
        name: 'magic',
        tables: [
          {
            name: 'users',
            columns: [
              { name: 'username', db: 'text' },
              { name: 'password', db: 'text' },
            ],
          },
          { name: 'roles', columns: [{ name: 'name', db: 'text' }] },
        ],
      }),
    ).toEqual({ users: ['username', 'password'], roles: ['name'] });
  });

  it('maps tables without columns to an empty list', () => {
    expect(
      sqlHintTables({ name: 'magic', tables: [{ name: 'a', columns: null }, { name: 'b' }] }),
    ).toEqual({ a: [], b: [] });
  });

  it('lets a later table with the same name win', () => {
    expect(
      sqlHintTables({
        name: 'magic',
        tables: [
          { name: 't', columns: [{ name: 'x', db: 'int' }] },
          { name: 't', columns: [{ name: 'y', db: 'int' }] },
        ],
      }),
    ).toEqual({ t: ['y'] });
  });
});
