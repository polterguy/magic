// @vitest-environment jsdom
/*
 * Database-selection state shared by SQL Studio and the Generator: the type, connection string
 * and database cascade with its deep links, fallbacks and stale-answer guards, the snippet list
 * and the two pure helpers (autocomplete tables, AI context).
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api';
import { buildSqlAiContext, sqlHintTables, useDatabaseSelection, useSqlSnippets } from '../sql';
import { setToastListener, type Toast } from '../toast';

vi.mock('../api', async importOriginal => ({
  ...(await importOriginal<typeof import('../api')>()),
  defaultDatabaseType: vi.fn(),
  exportDdl: vi.fn(),
  listDatabases: vi.fn(),
  listFiles: vi.fn(),
  http: { get: vi.fn() },
}));

let toasts: Toast[];

// Connection strings by database type, as the backend answers them.
let connections: Record<string, Record<string, string> | null | Error>;
// Databases by "type|connection string".
let schemas: Record<string, { name: string; tables?: { name: string }[] }[] | null | Error>;

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
  connections = { sqlite: { generic: 'g', other: 'o' } };
  schemas = { 'sqlite|generic': [{ name: 'magic' }, { name: 'shop' }] };
  vi.mocked(api.defaultDatabaseType).mockResolvedValue({
    default: 'sqlite',
    options: ['sqlite', 'mysql'],
  });
  vi.mocked(api.http.get).mockImplementation((url: string) => {
    const type = decodeURIComponent(url.split('databaseType=')[1]);
    const answer = connections[type];
    return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer);
  });
  vi.mocked(api.listDatabases).mockImplementation((type: string, cs: string) => {
    const answer = schemas[type + '|' + cs];
    return answer instanceof Error
      ? Promise.reject(answer)
      : Promise.resolve({ databases: answer ?? null });
  });
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

function selection(options?: { preferMagic?: boolean }, route = '/') {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
  );
  return renderHook(() => useDatabaseSelection(options), { wrapper });
}

describe('useDatabaseSelection cascade', () => {
  it('walks type, connection string and database, preferring generic and a non-magic database', async () => {
    const { result } = selection();
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.types).toEqual(['sqlite', 'mysql']);
    expect(result.current.type).toBe('sqlite');
    expect(result.current.connectionStrings).toEqual(['generic', 'other']);
    expect(result.current.connectionString).toBe('generic');
    expect(result.current.database).toBe('shop');
    expect(result.current.selectedMeta).toEqual({ name: 'shop' });
    expect(result.current.databasesMeta).toHaveLength(2);
    expect(api.http.get).toHaveBeenCalledWith(
      '/magic/system/sql/connection-strings?databaseType=sqlite',
    );
  });

  it('picks the first connection string when there is no generic one', async () => {
    connections.sqlite = { zeta: 'z', alpha: 'a' };
    schemas['sqlite|zeta'] = [{ name: 'one' }];
    const { result } = selection();
    await waitFor(() => expect(result.current.database).toBe('one'));
    expect(result.current.connectionString).toBe('zeta');
  });

  it('prefers the magic database when asked to', async () => {
    const { result } = selection({ preferMagic: true });
    await waitFor(() => expect(result.current.database).toBe('magic'));
  });

  it('falls back to the first database when asked for magic and there is none', async () => {
    schemas['sqlite|generic'] = [{ name: 'shop' }];
    const { result } = selection({ preferMagic: true });
    await waitFor(() => expect(result.current.database).toBe('shop'));
  });

  it('settles on magic when it is the only database', async () => {
    schemas['sqlite|generic'] = [{ name: 'magic' }];
    const { result } = selection();
    await waitFor(() => expect(result.current.database).toBe('magic'));
  });

  it('selects nothing when the schema has no databases', async () => {
    schemas['sqlite|generic'] = [];
    const { result } = selection();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.database).toBe('');
    expect(result.current.selectedMeta).toBeUndefined();
  });

  it('treats a null database list as empty', async () => {
    schemas['sqlite|generic'] = null;
    const { result } = selection({ preferMagic: true });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.databasesMeta).toEqual([]);
    expect(result.current.database).toBe('');
  });

  it('follows a deep link to a type, connection string and database', async () => {
    connections.mysql = { generic: 'g', mine: 'm' };
    schemas['mysql|mine'] = [{ name: 'a' }, { name: 'wanted' }];
    const { result } = selection(undefined, '/?dbType=mysql&dbCString=mine&dbName=wanted');
    await waitFor(() => expect(result.current.database).toBe('wanted'));
    expect(result.current.type).toBe('mysql');
    expect(result.current.connectionString).toBe('mine');
  });

  it('ignores a deep link naming a connection string or database that does not exist', async () => {
    const { result } = selection(undefined, '/?dbCString=missing&dbName=missing');
    await waitFor(() => expect(result.current.database).toBe('shop'));
    expect(result.current.connectionString).toBe('generic');
  });

  it('consumes a deep link once, so a later type change starts from the defaults', async () => {
    connections.mysql = { generic: 'g', mine: 'm' };
    schemas['mysql|generic'] = [{ name: 'other' }];
    const { result } = selection(undefined, '/?dbCString=other');
    await waitFor(() => expect(result.current.connectionString).toBe('other'));
    act(() => result.current.setType('mysql'));
    await waitFor(() => expect(result.current.database).toBe('other'));
    expect(result.current.connectionString).toBe('generic');
  });

  it('lets the user switch connection string and database', async () => {
    schemas['sqlite|other'] = [{ name: 'x' }, { name: 'y' }];
    const { result } = selection();
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setConnectionString('other'));
    await waitFor(() => expect(result.current.database).toBe('x'));
    act(() => result.current.setDatabase('y'));
    expect(result.current.selectedMeta).toEqual({ name: 'y' });
  });
});

describe('useDatabaseSelection failures and empty answers', () => {
  it('clears the selection for a type with no connection strings', async () => {
    connections.sqlite = {};
    const { result } = selection();
    await waitFor(() => expect(result.current.connectionsLoaded).toBe(true));
    expect(result.current.connectionStrings).toEqual([]);
    expect(result.current.connectionString).toBe('');
    expect(result.current.database).toBe('');
    expect(result.current.loading).toBe(false);
  });

  it('treats a null connection-string answer as none', async () => {
    connections.sqlite = null;
    const { result } = selection();
    await waitFor(() => expect(result.current.connectionsLoaded).toBe(true));
    expect(result.current.connectionStrings).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('clears the selection quietly when the connection strings cannot be fetched', async () => {
    connections.sqlite = new Error('null config');
    const { result } = selection();
    await waitFor(() => expect(result.current.connectionsLoaded).toBe(true));
    expect(result.current.connectionStrings).toEqual([]);
    expect(result.current.error).toBe('');
    expect(result.current.loading).toBe(false);
    expect(toasts).toEqual([]);
  });

  it('shows the error when the default database type cannot be fetched', async () => {
    vi.mocked(api.defaultDatabaseType).mockRejectedValue(new Error('no backend'));
    const { result } = selection();
    await waitFor(() => expect(result.current.error).toBe('no backend'));
    expect(result.current.loading).toBe(false);
    expect(result.current.type).toBe('');
  });

  it('clears the databases when the schema cannot be fetched', async () => {
    schemas['sqlite|generic'] = new Error('db down');
    const { result } = selection();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.databasesMeta).toEqual([]);
    expect(result.current.database).toBe('');
  });

  it('ignores a slow answer for a type the user has already left', async () => {
    let releaseSqlite: (value: Record<string, string>) => void = () => {
      // replaced below, once the first request is made
    };
    connections.mysql = { onlymysql: 'm' };
    schemas['mysql|onlymysql'] = [{ name: 'mdb' }];
    vi.mocked(api.http.get).mockImplementation((url: string) => {
      if (url.endsWith('=sqlite')) {
        return new Promise(resolve => {
          releaseSqlite = resolve;
        });
      }
      return Promise.resolve(connections.mysql);
    });
    const { result } = selection();
    await waitFor(() => expect(result.current.type).toBe('sqlite'));
    act(() => result.current.setType('mysql'));
    await waitFor(() => expect(result.current.database).toBe('mdb'));
    await act(async () => {
      releaseSqlite({ stale: 's' });
      await Promise.resolve();
    });
    expect(result.current.connectionStrings).toEqual(['onlymysql']);
    expect(result.current.connectionString).toBe('onlymysql');
  });

  it('ignores a slow failure for a type the user has already left', async () => {
    let failSqlite: (reason: Error) => void = () => {
      // replaced below, once the first request is made
    };
    connections.mysql = { onlymysql: 'm' };
    schemas['mysql|onlymysql'] = [{ name: 'mdb' }];
    vi.mocked(api.http.get).mockImplementation((url: string) => {
      if (url.endsWith('=sqlite')) {
        return new Promise((_, reject) => {
          failSqlite = reject as typeof failSqlite;
        });
      }
      return Promise.resolve(connections.mysql);
    });
    const { result } = selection();
    await waitFor(() => expect(result.current.type).toBe('sqlite'));
    act(() => result.current.setType('mysql'));
    await waitFor(() => expect(result.current.database).toBe('mdb'));
    await act(async () => {
      failSqlite(new Error('late'));
      await Promise.resolve();
    });
    expect(result.current.connectionStrings).toEqual(['onlymysql']);
    expect(result.current.database).toBe('mdb');
  });

  it('ignores slow schema answers and failures for a connection string the user has left', async () => {
    const pending: Record<string, { ok: (v: unknown) => void; fail: (e: Error) => void }> = {};
    vi.mocked(api.listDatabases).mockImplementation(
      (_type: string, cs: string) =>
        new Promise((ok, fail) => {
          pending[cs] = { ok: ok as (v: unknown) => void, fail };
        }),
    );
    const { result } = selection();
    await waitFor(() => expect(pending.generic).toBeDefined());
    act(() => result.current.setConnectionString('other'));
    await waitFor(() => expect(pending.other).toBeDefined());
    await act(async () => {
      pending.generic.ok({ databases: [{ name: 'stale' }] });
      await Promise.resolve();
    });
    expect(result.current.databasesMeta).toEqual([]);
    await act(async () => {
      pending.other.ok({ databases: [{ name: 'fresh' }] });
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.database).toBe('fresh'));

    act(() => result.current.setConnectionString('generic'));
    await waitFor(() => expect(result.current.databasesMeta).toEqual([{ name: 'fresh' }]));
    act(() => result.current.setConnectionString('other'));
    await act(async () => {
      pending.generic.fail(new Error('late failure'));
      await Promise.resolve();
    });
    expect(result.current.database).toBe('fresh');
  });
});

describe('useDatabaseSelection reloadSchema', () => {
  it('refetches the databases in place', async () => {
    const { result } = selection();
    await waitFor(() => expect(result.current.loading).toBe(false));
    schemas['sqlite|generic'] = [{ name: 'magic' }, { name: 'shop' }, { name: 'extra' }];
    await act(() => result.current.reloadSchema());
    expect(result.current.databasesMeta.map(db => db.name)).toEqual(['magic', 'shop', 'extra']);
  });

  it('treats a null reload answer as no databases', async () => {
    const { result } = selection();
    await waitFor(() => expect(result.current.loading).toBe(false));
    schemas['sqlite|generic'] = null;
    await act(() => result.current.reloadSchema());
    expect(result.current.databasesMeta).toEqual([]);
  });

  it('toasts the error when the reload fails and keeps what it had', async () => {
    const { result } = selection();
    await waitFor(() => expect(result.current.loading).toBe(false));
    schemas['sqlite|generic'] = new Error('gone');
    await act(() => result.current.reloadSchema());
    expect(toasts).toEqual([expect.objectContaining({ text: 'gone', isError: true })]);
    expect(result.current.databasesMeta).toHaveLength(2);
  });
});

describe('useSqlSnippets', () => {
  it('lists only the .sql files of the type', async () => {
    vi.mocked(api.listFiles).mockResolvedValue(['/etc/sqlite/templates/a.sql', '/x/b.txt']);
    const { result } = renderHook(() => useSqlSnippets('sqlite'));
    await waitFor(() => expect(result.current.snippets).toEqual(['/etc/sqlite/templates/a.sql']));
    expect(api.listFiles).toHaveBeenCalledWith('/etc/sqlite/templates/');
  });

  it('asks for nothing until a type is chosen', () => {
    const { result } = renderHook(() => useSqlSnippets(''));
    expect(result.current.snippets).toEqual([]);
    expect(api.listFiles).not.toHaveBeenCalled();
  });

  it('treats a null folder listing as empty', async () => {
    vi.mocked(api.listFiles).mockResolvedValue(null as unknown as string[]);
    const { result } = renderHook(() => useSqlSnippets('mysql'));
    await waitFor(() => expect(api.listFiles).toHaveBeenCalled());
    expect(result.current.snippets).toEqual([]);
  });

  it('empties the list when the folder cannot be read', async () => {
    vi.mocked(api.listFiles).mockRejectedValue(new Error('missing folder'));
    const { result } = renderHook(() => useSqlSnippets('mysql'));
    await waitFor(() => expect(api.listFiles).toHaveBeenCalled());
    expect(result.current.snippets).toEqual([]);
  });

  it('lets the caller change the list', () => {
    vi.mocked(api.listFiles).mockResolvedValue([]);
    const { result } = renderHook(() => useSqlSnippets('mysql'));
    act(() => result.current.setSnippets(['n.sql']));
    expect(result.current.snippets).toEqual(['n.sql']);
  });
});

describe('sqlHintTables', () => {
  it('maps each table to its column names', () => {
    expect(
      sqlHintTables({
        name: 'd',
        tables: [
          { name: 'a', columns: [{ name: 'id' } as never, { name: 'x' } as never] },
          { name: 'b', columns: null },
          { name: 'c' },
        ],
      }),
    ).toEqual({ a: ['id', 'x'], b: [], c: [] });
  });

  it('answers an empty map without a database or tables', () => {
    expect(sqlHintTables(undefined)).toEqual({});
    expect(sqlHintTables({ name: 'd', tables: null })).toEqual({});
  });
});

describe('buildSqlAiContext', () => {
  const base = { type: 'sqlite', connectionString: 'generic', database: 'shop' };

  it('gives only the dialect when there is nothing else', async () => {
    const context = await buildSqlAiContext({ ...base, tables: [], sql: '' });
    expect(context).toBe('SQL dialect: SQLite\n\n');
    expect(api.exportDdl).not.toHaveBeenCalled();
  });

  it('names the dialect for each known type and passes an unknown one through', async () => {
    const dialect = async (type: string) =>
      (await buildSqlAiContext({ ...base, type, tables: [], sql: '' })).trim();
    expect(await dialect('mysql')).toBe('SQL dialect: MySQL');
    expect(await dialect('mssql')).toBe('SQL dialect: Microsoft SQL Server');
    expect(await dialect('pgsql')).toBe('SQL dialect: PostgreSQL');
    expect(await dialect('oracle')).toBe('SQL dialect: oracle');
  });

  it('includes the schema DDL, arguments, code and the SQL-only instruction', async () => {
    vi.mocked(api.exportDdl).mockResolvedValue({ result: 'CREATE TABLE a (id int);' });
    const context = await buildSqlAiContext({
      ...base,
      tables: [{ name: 'a' }, { name: 'b' }],
      sql: 'select 1',
      args: [
        { name: 'id', type: 'int' },
        { name: '', type: 'string' },
        { name: 'q', type: 'string' },
      ],
    });
    expect(api.exportDdl).toHaveBeenCalledWith('sqlite', 'generic', 'shop', ['a', 'b'], true);
    expect(context).toContain('Current schema:\n\nCREATE TABLE a (id int);\n\n');
    expect(context).toContain('SQL dialect: SQLite');
    expect(context).toContain('reference them in the SQL as @name: id (int), q (string)\n\n');
    expect(context).toContain('Current code: \n\nselect 1');
    expect(context).toContain('**IMPORTANT** - Return ONLY SQL!');
  });

  it('leaves out the arguments line when every argument is unnamed', async () => {
    const context = await buildSqlAiContext({
      ...base,
      tables: [],
      sql: 'select 1',
      args: [{ name: '', type: 'int' }],
    });
    expect(context).not.toContain('Declared endpoint arguments');
    expect(context).toContain('Current code: \n\nselect 1');
    expect(context).not.toContain('IMPORTANT');
  });
});
