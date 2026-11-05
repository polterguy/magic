// @vitest-environment jsdom
/*
 * useCrudTab: resets the selection when the database changes, keeps the component URL on the
 * single selected table, counts the endpoints the selection would produce, and drives generation.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { useCrudTab } from '../hooks/useCrudTab';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

const mocks = vi.hoisted(() => ({ selection: { current: {} } }));

vi.mock('../../../lib/sql', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useDatabaseSelection: () => mocks.selection.current,
}));

const SHOP = {
  name: 'shop',
  tables: [
    {
      name: 'orders',
      columns: [
        { name: 'id', db: 'int', hl: 'long', primary: true, automatic: true },
        { name: 'title', db: 'text', hl: 'string' },
      ],
    },
    { name: 'log', columns: [{ name: 'message', db: 'text', hl: 'string' }] },
  ],
};
const CRM = { name: 'crm', tables: [{ name: 'leads', columns: [] }] };

function select(meta: typeof SHOP | typeof CRM) {
  mocks.selection.current = {
    type: 'sqlite',
    connectionString: 'generic',
    database: meta.name,
    selectedMeta: meta,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  select(SHOP);
  vi.mocked(api.listRoles).mockResolvedValue([{ name: 'root' }, { name: 'dev' }] as never);
  vi.mocked(api.crudify).mockResolvedValue({ loc: 4 } as never);
});

describe('useCrudTab', () => {
  it('loads the roles and starts with every verb and nothing selected', async () => {
    const { result } = renderHook(() => useCrudTab(false));

    await waitFor(() => expect(result.current.roles).toEqual(['root', 'dev']));
    expect([...result.current.verbs].sort((a, b) => a.localeCompare(b))).toEqual([
      'delete',
      'get',
      'post',
      'put',
    ]);
    expect(result.current.selectedTables.size).toBe(0);
    expect(result.current.moduleName).toBe('shop');
    expect(result.current.tables).toHaveLength(2);
    expect(result.current.plannedEndpoints).toBe(0);
  });

  it('keeps an empty role list when the roles cannot be loaded', async () => {
    vi.mocked(api.listRoles).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useCrudTab(false));

    await waitFor(() => expect(api.listRoles).toHaveBeenCalled());
    expect(result.current.roles).toEqual([]);
  });

  it('preselects every table in the guided flow', () => {
    const { result } = renderHook(() => useCrudTab(true));

    expect([...result.current.selectedTables]).toEqual(['orders', 'log']);
    expect(result.current.allSelected).toBe(true);
  });

  it('toggles tables, the single table and the component URL that follows it', () => {
    const { result } = renderHook(() => useCrudTab(false));

    act(() => result.current.toggleTable('orders'));
    expect(result.current.singleTable).toBe('orders');
    expect(result.current.componentUrl).toBe('orders');
    expect(result.current.allSelected).toBe(false);

    act(() => result.current.setComponentUrl('custom'));
    expect(result.current.componentUrl).toBe('custom');

    act(() => result.current.toggleTable('log'));
    expect(result.current.singleTable).toBeNull();
    expect(result.current.allSelected).toBe(true);

    act(() => result.current.toggleTable('orders'));
    expect(result.current.singleTable).toBe('log');
    expect(result.current.componentUrl).toBe('log');
  });

  it('resets the selection, locks and module name when the database changes', () => {
    const { result, rerender } = renderHook(() => useCrudTab(false));
    act(() => {
      result.current.toggleTable('orders');
      result.current.toggleExpanded('orders');
      result.current.setColumnLock('orders', 'title', { mode: 'custom', slot: 's' });
      result.current.setModuleName('mine');
    });
    expect(result.current.locks.orders.title.slot).toBe('s');
    expect(result.current.expandedTables.has('orders')).toBe(true);

    select(CRM);
    rerender();

    expect(result.current.selectedTables.size).toBe(0);
    expect(result.current.expandedTables.size).toBe(0);
    expect(result.current.locks).toEqual({});
    expect(result.current.moduleName).toBe('crm');
  });

  it('toggles a table detail open and shut and a verb off and on', () => {
    const { result } = renderHook(() => useCrudTab(false));

    act(() => result.current.toggleExpanded('orders'));
    expect(result.current.expandedTables.has('orders')).toBe(true);
    act(() => result.current.toggleExpanded('orders'));
    expect(result.current.expandedTables.has('orders')).toBe(false);

    act(() => result.current.toggleVerb('delete'));
    expect(result.current.verbs.has('delete')).toBe(false);
    act(() => result.current.toggleVerb('delete'));
    expect(result.current.verbs.has('delete')).toBe(true);
  });

  it('counts the endpoints the selection produces, skipping verbs a table cannot support', () => {
    const { result } = renderHook(() => useCrudTab(false));

    act(() => result.current.toggleTable('orders'));
    // POST 1 + GET 2 + PUT 1 + DELETE 1.
    expect(result.current.plannedEndpoints).toBe(5);

    act(() => result.current.toggleTable('log'));
    // log has no primary key: only POST 1 + GET 2 more.
    expect(result.current.plannedEndpoints).toBe(8);

    act(() => result.current.setAggregate(true));
    // The aggregate option adds two endpoints to each GET.
    expect(result.current.plannedEndpoints).toBe(12);

    act(() => result.current.toggleVerb('get'));
    expect(result.current.plannedEndpoints).toBe(1 + 1 + 1 + 1);
  });

  it('feeds its options into the generation run', async () => {
    const { result } = renderHook(() => useCrudTab(false));
    act(() => {
      result.current.toggleTable('orders');
      result.current.setModuleName('mymod');
      result.current.setAuth(['dev']);
      result.current.setLogging(false);
      result.current.setOverwrite(true);
    });
    // Each toggle builds on the verbs of the render before it, so they are separate changes.
    for (const verb of ['get', 'put', 'delete']) {
      act(() => result.current.toggleVerb(verb));
    }

    await act(() => result.current.generate());

    expect(api.crudify).toHaveBeenCalledTimes(1);
    expect(vi.mocked(api.crudify).mock.calls[0][0]).toMatchObject({
      moduleName: 'mymod',
      moduleUrl: 'orders',
      table: 'orders',
      verb: 'post',
      auth: 'dev',
      overwrite: true,
    });
    expect(vi.mocked(api.crudify).mock.calls[0][0]).not.toHaveProperty('log');
    expect(result.current.feed?.at(-1)?.type).toBe('success');
  });
});
