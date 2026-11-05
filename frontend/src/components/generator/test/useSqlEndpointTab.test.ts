// @vitest-environment jsdom
/*
 * useSqlEndpointTab: the module name follows the database, snippets and .sql files fill the
 * editor, and generating sends the filtered arguments.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import * as sqlLib from '../../../lib/sql';
import { showToast } from '../../../lib/toast';
import { useSqlEndpointTab } from '../hooks/useSqlEndpointTab';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

vi.mock('../../../lib/toast', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  showToast: vi.fn(),
}));

const mocks = vi.hoisted(() => ({ selection: { current: {} } }));

vi.mock('../../../lib/sql', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useDatabaseSelection: () => mocks.selection.current,
  buildSqlAiContext: vi.fn().mockResolvedValue('context'),
}));

const META = { name: 'shop', tables: [{ name: 'orders', columns: [{ name: 'id', db: 'int' }] }] };

function select(database: string) {
  mocks.selection.current = {
    type: 'sqlite',
    connectionString: 'generic',
    database,
    selectedMeta: database ? META : undefined,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  select('shop');
  vi.mocked(api.listRoles).mockResolvedValue([{ name: 'root' }, { name: 'dev' }] as never);
  vi.mocked(api.listFiles).mockResolvedValue(['/etc/sqlite/templates/a.sql', '/etc/x.txt']);
  vi.mocked(api.customSqlEndpoint).mockResolvedValue(undefined as never);
});

describe('useSqlEndpointTab', () => {
  it('loads the roles and the saved .sql snippets of the database type', async () => {
    const { result } = renderHook(() => useSqlEndpointTab());

    await waitFor(() => expect(result.current.roles).toEqual(['root', 'dev']));
    await waitFor(() => expect(result.current.snippets).toEqual(['/etc/sqlite/templates/a.sql']));
    expect(api.listFiles).toHaveBeenCalledWith('/etc/sqlite/templates/');
  });

  it('keeps an empty role list when the roles cannot be loaded', async () => {
    vi.mocked(api.listRoles).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useSqlEndpointTab());

    await waitFor(() => expect(api.listRoles).toHaveBeenCalled());
    expect(result.current.roles).toEqual([]);
    expect(result.current.auth).toEqual(['root', 'admin']);
  });

  it('follows the selected database for the module name', () => {
    const { result, rerender } = renderHook(() => useSqlEndpointTab());
    expect(result.current.moduleName).toBe('shop');

    select('crm');
    rerender();
    expect(result.current.moduleName).toBe('crm');

    // No database selected keeps what is there.
    select('');
    rerender();
    expect(result.current.moduleName).toBe('crm');
  });

  it('exposes the tables for autocomplete hints', () => {
    const { result } = renderHook(() => useSqlEndpointTab());

    expect(result.current.hintTables).toEqual(sqlLib.sqlHintTables(META));
    expect(result.current.hintTables).toHaveProperty('orders');
  });

  it('opens a snippet into the editor and bumps the edit token', async () => {
    vi.mocked(api.loadFile).mockResolvedValue('select 1');
    const { result } = renderHook(() => useSqlEndpointTab());
    const before = result.current.sqlEditId;

    await act(() => result.current.openSnippet('/etc/sqlite/templates/a.sql'));

    expect(result.current.sql).toBe('select 1');
    expect(result.current.sqlEditId).toBe(before + 1);
  });

  it('ignores an empty snippet choice', async () => {
    const { result } = renderHook(() => useSqlEndpointTab());

    await act(() => result.current.openSnippet(''));

    expect(api.loadFile).not.toHaveBeenCalled();
  });

  it('reports a snippet that cannot be loaded', async () => {
    vi.mocked(api.loadFile).mockRejectedValue(new Error('missing'));
    const { result } = renderHook(() => useSqlEndpointTab());

    await act(() => result.current.openSnippet('/a.sql'));

    expect(showToast).toHaveBeenCalledWith('missing', true, undefined);
    expect(result.current.sql).toBe('');
  });

  it('imports a .sql file into the editor', async () => {
    const { result } = renderHook(() => useSqlEndpointTab());

    act(() => result.current.importSqlFile(new File(['select 2'], 'q.sql')));

    await waitFor(() => expect(result.current.sql).toBe('select 2'));
    expect(result.current.sqlEditId).toBe(1);
  });

  it('builds the AI context from the selection, the SQL and the arguments', async () => {
    const { result } = renderHook(() => useSqlEndpointTab());
    act(() => {
      result.current.setSql('select 1');
      result.current.setArgs([{ id: 'a', name: 'id', type: 'long' }]);
    });

    await result.current.createAiContext();

    expect(sqlLib.buildSqlAiContext).toHaveBeenCalledWith({
      type: 'sqlite',
      connectionString: 'generic',
      database: 'shop',
      tables: META.tables,
      sql: 'select 1',
      args: [{ id: 'a', name: 'id', type: 'long' }],
    });
  });

  it('refuses to generate without SQL', async () => {
    const { result } = renderHook(() => useSqlEndpointTab());

    await act(() => result.current.generate());

    expect(showToast).toHaveBeenCalledWith(
      'Provide SQL, a module name, and an endpoint name',
      true,
    );
    expect(api.customSqlEndpoint).not.toHaveBeenCalled();
  });

  it('generates the endpoint, sending only the named arguments', async () => {
    const { result } = renderHook(() => useSqlEndpointTab());
    act(() => {
      result.current.setSql('select * from orders where id = @id');
      result.current.setVerb('post');
      result.current.setOverwrite(true);
      result.current.setArgs([
        { id: 'a', name: 'id', type: 'long' },
        { id: 'b', name: '', type: 'string' },
        { id: 'c', name: 'name', type: 'string' },
      ]);
    });

    await act(() => result.current.generate());

    expect(api.customSqlEndpoint).toHaveBeenCalledWith({
      databaseType: 'sqlite',
      database: 'shop',
      authorization: 'root,admin',
      moduleName: 'shop',
      endpointName: 'custom-sql',
      verb: 'post',
      sql: 'select * from orders where id = @id',
      arguments: 'id:long\nname:string',
      overwrite: true,
    });
    expect(showToast).toHaveBeenCalledWith('Endpoint magic/shop/custom-sql created');
    expect(result.current.busy).toBe(false);
  });

  it('reports a failed generation as an error toast', async () => {
    vi.mocked(api.customSqlEndpoint).mockRejectedValue(new Error('bad sql'));
    const { result } = renderHook(() => useSqlEndpointTab());
    act(() => result.current.setSql('select 1'));

    await act(() => result.current.generate());

    expect(showToast).toHaveBeenCalledWith('bad sql', true, undefined);
    expect(result.current.busy).toBe(false);
  });
});
