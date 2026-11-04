/*
 * Unit tests for the Databases page helpers — name validation, config
 * parsing and the connection status bookkeeping.
 */

import { describe, it, expect } from 'vitest';
import type { MagicConfig } from '../../../lib/api';
import {
  CSTRING_NAME_PATTERN,
  type ConnectionRow,
  DB_NAME_PATTERN,
  connectionError,
  connectionRows,
  sqlStudioUrl,
  statusBadge,
  withStatus,
} from '../connections';

describe('DB_NAME_PATTERN', () => {
  it('accepts alphanumerics, - and _', () => {
    expect(DB_NAME_PATTERN.test('my-db_2')).toBe(true);
  });

  it('rejects empty names, spaces, dots and slashes', () => {
    for (const name of ['', 'my db', 'a.b', '../x']) {
      expect(DB_NAME_PATTERN.test(name)).toBe(false);
    }
  });
});

describe('CSTRING_NAME_PATTERN', () => {
  it('accepts word characters only', () => {
    expect(CSTRING_NAME_PATTERN.test('generic_2')).toBe(true);
    expect(CSTRING_NAME_PATTERN.test('my-conn')).toBe(false);
    expect(CSTRING_NAME_PATTERN.test('')).toBe(false);
  });
});

describe('statusBadge', () => {
  it('maps live and down to their badges, anything else to debug', () => {
    expect(statusBadge('live')).toBe('badge badge-get');
    expect(statusBadge('down')).toBe('badge badge-error');
    expect(statusBadge('testing')).toBe('badge badge-debug');
  });
});

describe('sqlStudioUrl', () => {
  it('builds the deep link SQL Studio consumes', () => {
    expect(sqlStudioUrl('sqlite', 'generic', 'magic')).toBe(
      '/sql-studio?dbType=sqlite&dbCString=generic&dbName=magic',
    );
  });
});

describe('connectionRows', () => {
  it('lists the external types in order, each untested', () => {
    const config: MagicConfig = {
      magic: {
        databases: {
          default: 'sqlite',
          sqlite: { generic: 'Data Source=x' },
          mssql: { generic: 'Server=s;Database={database}' },
          mysql: { generic: 'Server=m;Database={database}', other: 'o' },
        },
      },
    };
    expect(connectionRows(config)).toEqual([
      {
        type: 'mysql',
        name: 'generic',
        connectionString: 'Server=m;Database={database}',
        status: 'testing',
      },
      { type: 'mysql', name: 'other', connectionString: 'o', status: 'testing' },
      {
        type: 'mssql',
        name: 'generic',
        connectionString: 'Server=s;Database={database}',
        status: 'testing',
      },
    ]);
  });

  it('is empty without databases in the config', () => {
    expect(connectionRows(null)).toEqual([]);
    expect(connectionRows({})).toEqual([]);
    expect(connectionRows({ magic: { databases: { mysql: 'oops' } } })).toEqual([]);
  });

  it('throws when a type is configured as null', () => {
    // typeof null is 'object', so Object.keys(null) runs (see report).
    const config = { magic: { databases: { mysql: null } } } as unknown as MagicConfig;
    expect(() => connectionRows(config)).toThrow(TypeError);
  });
});

describe('withStatus', () => {
  const rows: ConnectionRow[] = [
    { type: 'mysql', name: 'a', connectionString: '1', status: 'testing' },
    { type: 'pgsql', name: 'a', connectionString: '2', status: 'testing' },
  ];

  it('updates only the row matching type and name', () => {
    expect(withStatus(rows, rows[1], 'live').map(row => row.status)).toEqual(['testing', 'live']);
  });

  it('does not mutate the rows', () => {
    withStatus(rows, rows[0], 'down');
    expect(rows[0].status).toBe('testing');
  });
});

describe('connectionError', () => {
  const rows: ConnectionRow[] = [
    { type: 'mysql', name: 'taken', connectionString: 'x', status: 'live' },
  ];
  const valid = 'Server=x;Database={database}';

  it('is null for a valid, unused connection', () => {
    expect(connectionError('mysql', 'fresh', valid, rows)).toBeNull();
    // The same name on another type is fine.
    expect(connectionError('pgsql', 'taken', valid, rows)).toBeNull();
  });

  it('needs a name and a connection string', () => {
    expect(connectionError('mysql', '', valid, rows)).toBe(
      'Give the connection a name and a connection string',
    );
    expect(connectionError('mysql', 'a', '', rows)).toBe(
      'Give the connection a name and a connection string',
    );
  });

  it('needs the {database} placeholder', () => {
    expect(connectionError('mysql', 'a', 'Server=x', rows)).toBe(
      'The connection string must contain the {database} placeholder',
    );
  });

  it('needs a word-character name', () => {
    expect(connectionError('mysql', 'my-conn', valid, rows)).toBe(
      'Connection names accept alphanumeric characters and _',
    );
  });

  it('rejects a name already in use for the type', () => {
    expect(connectionError('mysql', 'taken', valid, rows)).toBe(
      'That name is already in use for mysql',
    );
  });
});
