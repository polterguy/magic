/*
 * Unit tests for the Designer's new-table and add-column helpers.
 */

import { describe, it, expect } from 'vitest';
import { FIELD_TYPES } from '../../lib/dbTypes';
import type { TableMeta } from '../../lib/api';
import {
  canAddColumn,
  canCreateTable,
  columnPayload,
  defaultFieldType,
  foreignPrimaryKey,
  primaryKeyName,
  referenceableTables,
} from './schema';

describe('primaryKeyName', () => {
  it('singularises a trailing s and appends _id', () => {
    expect(primaryKeyName('users')).toBe('user_id');
    expect(primaryKeyName('person')).toBe('person_id');
  });

  it('only strips one s', () => {
    expect(primaryKeyName('address')).toBe('addres_id');
    expect(primaryKeyName('s')).toBe('_id');
  });
});

describe('canCreateTable', () => {
  it('needs both a table name and a primary key name', () => {
    expect(canCreateTable('users', 'user_id')).toBe(true);
    expect(canCreateTable('', 'user_id')).toBe(false);
    expect(canCreateTable('users', '')).toBe(false);
  });

  it('does not validate characters', () => {
    expect(canCreateTable('bad name;', 'x y')).toBe(true);
  });
});

describe('defaultFieldType', () => {
  it('prefers an exact text type', () => {
    expect(defaultFieldType(FIELD_TYPES.sqlite).name).toBe('text');
    expect(defaultFieldType(FIELD_TYPES.pgsql).name).toBe('text');
  });

  it('falls back to the first char/text type', () => {
    expect(defaultFieldType(FIELD_TYPES.mysql).name).toBe('varchar');
    expect(defaultFieldType(FIELD_TYPES.mssql).name).toBe('nvarchar');
  });

  it('falls back to the first type', () => {
    expect(defaultFieldType([{ name: 'int' }, { name: 'bool' }]).name).toBe('int');
  });
});

const tables: TableMeta[] = [
  {
    name: 'users',
    columns: [
      { name: 'user_id', db: 'integer', primary: true, hl: 'long' },
      { name: 'name', db: 'text' },
    ],
  },
  { name: 'codes', columns: [{ name: 'code', db: 'varchar', primary: true, hl: 'string' }] },
  { name: 'log', columns: [{ name: 'line', db: 'text' }] },
  { name: 'empty', columns: null },
];

describe('foreignPrimaryKey', () => {
  it('is the referenced table primary key column', () => {
    expect(foreignPrimaryKey(tables, 'users')?.name).toBe('user_id');
  });

  it('is undefined for unknown tables and tables without a key', () => {
    expect(foreignPrimaryKey(tables, '')).toBeUndefined();
    expect(foreignPrimaryKey(tables, 'log')).toBeUndefined();
    expect(foreignPrimaryKey(tables, 'empty')).toBeUndefined();
  });
});

describe('referenceableTables', () => {
  it('keeps only tables with a primary key', () => {
    expect(referenceableTables(tables).map(table => table.name)).toEqual(['users', 'codes']);
  });
});

describe('canAddColumn', () => {
  const pk = tables[0].columns![0];

  it('needs a column name', () => {
    expect(canAddColumn('', 'field', undefined)).toBe(false);
    expect(canAddColumn('age', 'field', undefined)).toBe(true);
  });

  it('needs a referenced primary key in foreign mode', () => {
    expect(canAddColumn('user_id', 'foreign', undefined)).toBe(false);
    expect(canAddColumn('user_id', 'foreign', pk)).toBe(true);
  });
});

describe('columnPayload', () => {
  const base = {
    columnName: 'age',
    fieldTypes: FIELD_TYPES.mysql,
    fieldType: FIELD_TYPES.mysql[0],
    columnLength: '255',
    defaultValue: '',
    nullable: true,
    foreignTable: '',
    foreignPk: undefined,
    cascading: true,
  };

  it('builds a plain field without length for sizeless types', () => {
    expect(columnPayload('field', base)).toEqual({
      columnName: 'age',
      columnType: 'int',
      defaultValue: null,
      nullable: true,
      columnLength: null,
      foreignTable: '',
      foreignField: '',
      cascading: false,
    });
  });

  it('keeps a default value and the length of sized types', () => {
    const payload = columnPayload('field', {
      ...base,
      fieldType: FIELD_TYPES.mysql[1],
      columnLength: '80',
      defaultValue: 'x',
    });
    expect(payload).toMatchObject({ columnType: 'varchar', columnLength: 80, defaultValue: 'x' });
  });

  it('builds a field even without a column name (the button guards that)', () => {
    expect(columnPayload('field', { ...base, columnName: '' })?.columnName).toBe('');
  });

  it('types a foreign key after a numeric primary key as the first field type', () => {
    const payload = columnPayload('foreign', {
      ...base,
      columnName: 'user',
      foreignTable: 'users',
      foreignPk: foreignPrimaryKey(tables, 'users'),
    });
    expect(payload).toEqual({
      columnName: 'user',
      columnType: 'int',
      defaultValue: null,
      nullable: true,
      columnLength: null,
      foreignTable: 'users',
      foreignField: 'user_id',
      cascading: true,
    });
  });

  it('types a foreign key after a string primary key as varchar with a length', () => {
    const payload = columnPayload('foreign', {
      ...base,
      columnName: 'code',
      columnLength: '12',
      foreignTable: 'codes',
      foreignPk: foreignPrimaryKey(tables, 'codes'),
    });
    expect(payload).toMatchObject({
      columnType: 'varchar',
      columnLength: 12,
      foreignField: 'code',
    });
  });

  it('is null for an incomplete foreign key', () => {
    const pk = foreignPrimaryKey(tables, 'users');
    expect(
      columnPayload('foreign', { ...base, columnName: '', foreignTable: 'users', foreignPk: pk }),
    ).toBeNull();
    expect(columnPayload('foreign', { ...base, foreignTable: '', foreignPk: pk })).toBeNull();
    expect(columnPayload('foreign', { ...base, foreignTable: 'log' })).toBeNull();
  });
});
