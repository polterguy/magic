// @vitest-environment jsdom
/*
 * useCrudGeneration: validates the request, runs one crudify call per table and verb into the
 * progress feed, stops at a failure or a cancel, and reveals the guided flow's done panel.
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { showToast } from '../../../lib/toast';
import { CrudGenerationContext, useCrudGeneration } from '../hooks/useCrudGeneration';
import { CrudTable } from '../types';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

vi.mock('../../../lib/toast', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  showToast: vi.fn(),
}));

const ORDERS: CrudTable = {
  name: 'orders',
  columns: [
    { name: 'id', db: 'int', hl: 'long', primary: true, automatic: true },
    { name: 'title', db: 'text', hl: 'string' },
  ],
};

// No primary key, so PUT and DELETE have nothing to identify a row by.
const LOG: CrudTable = {
  name: 'log',
  columns: [{ name: 'message', db: 'text', hl: 'string' }],
};

function context(patch: Partial<CrudGenerationContext> = {}): CrudGenerationContext {
  return {
    guided: false,
    selection: { type: 'sqlite', connectionString: 'generic', database: 'shop' },
    tables: [ORDERS, LOG],
    selectedTables: new Set(['orders']),
    verbs: new Set(['post']),
    singleTable: 'orders',
    componentUrl: 'orders-url',
    locks: {},
    options: {
      auth: ['root'],
      logging: true,
      cache: '0',
      publicCache: false,
      overwrite: false,
      paging: true,
      sorting: true,
      aggregate: false,
      distinct: false,
      search: false,
      verbose: false,
      moduleName: '',
      live: false,
      liveAudience: 'inherited',
      liveValues: '',
    },
    ...patch,
  } as CrudGenerationContext;
}

function messages(feed: { type: string; message: string }[] | null) {
  return (feed ?? []).map(line => line.type + ': ' + line.message);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.crudify).mockResolvedValue({ loc: 12 } as never);
});

describe('useCrudGeneration', () => {
  it('refuses to start without a table and a verb', async () => {
    const { result } = renderHook(() => useCrudGeneration(context({ verbs: new Set() })));

    await act(() => result.current.generate());

    expect(showToast).toHaveBeenCalledWith('Select at least one table and one verb', true);
    expect(api.crudify).not.toHaveBeenCalled();
    expect(result.current.feed).toBeNull();
  });

  it('refuses a custom lock with no slot', async () => {
    const { result } = renderHook(() =>
      useCrudGeneration(context({ locks: { orders: { title: { mode: 'custom', slot: '  ' } } } })),
    );

    await act(() => result.current.generate());

    expect(showToast).toHaveBeenCalledWith('Enter the slot orders.title is locked to', true);
    expect(api.crudify).not.toHaveBeenCalled();
  });

  it('refuses live updates for chosen recipients without any', async () => {
    const base = context();
    const { result } = renderHook(() =>
      useCrudGeneration({
        ...base,
        options: { ...base.options, live: true, liveAudience: 'roles', liveValues: ' ' },
      }),
    );

    await act(() => result.current.generate());

    expect(showToast).toHaveBeenCalledWith(
      "Enter who should be notified, or choose the endpoint's own roles",
      true,
    );
    expect(api.crudify).not.toHaveBeenCalled();
  });

  it('generates one call per table and verb and reports the result', async () => {
    const { result } = renderHook(() =>
      useCrudGeneration(context({ verbs: new Set(['post', 'get']) })),
    );

    await act(() => result.current.generate());

    expect(api.crudify).toHaveBeenCalledTimes(2);
    const first = vi.mocked(api.crudify).mock.calls[0][0];
    expect(first).toMatchObject({
      databaseType: 'sqlite',
      database: '[generic|shop]',
      moduleName: 'shop',
      moduleUrl: 'orders-url',
      table: 'orders',
      verb: 'post',
      auth: 'root',
      log: 'shop.orders entry created',
    });
    const lines = messages(result.current.feed);
    expect(lines[0]).toBe('information: POST orders — 1 endpoint, 12 lines');
    expect(lines[1]).toBe('information: GET orders — 2 endpoints, 12 lines');
    expect(lines[2]).toContain('success: Done — 3 endpoints, 24 lines of Hyperlambda, in ');
    expect(lines[2]).toContain('→ /magic/shop/');
    expect(result.current.busy).toBe(false);
    expect(result.current.done).toBeNull();
  });

  it('does not force the component URL when several tables are selected', async () => {
    const { result } = renderHook(() =>
      useCrudGeneration(context({ selectedTables: new Set(['orders', 'log']), singleTable: null })),
    );

    await act(() => result.current.generate());

    const urls = vi.mocked(api.crudify).mock.calls.map(call => call[0].moduleUrl);
    expect(urls).toEqual(['orders', 'log']);
  });

  it('says why a verb was skipped', async () => {
    const { result } = renderHook(() =>
      useCrudGeneration(
        context({
          selectedTables: new Set(['log']),
          singleTable: 'log',
          verbs: new Set(['put', 'delete']),
        }),
      ),
    );

    await act(() => result.current.generate());

    expect(api.crudify).not.toHaveBeenCalled();
    const lines = messages(result.current.feed);
    expect(lines[0]).toBe('warning: PUT log — skipped, no primary key');
    expect(lines[1]).toBe('warning: DELETE log — skipped, no primary key');
    expect(lines[2]).toContain('Done — 0 endpoints');
  });

  it('says when a table has no columns for a verb', async () => {
    const empty: CrudTable = { name: 'empty', columns: [] };
    const { result } = renderHook(() =>
      useCrudGeneration(
        context({ tables: [empty], selectedTables: new Set(['empty']), singleTable: 'empty' }),
      ),
    );

    await act(() => result.current.generate());

    expect(messages(result.current.feed)[0]).toBe(
      'warning: POST empty — skipped, no columns for this verb',
    );
  });

  it('stops at the first failure and says how far it got', async () => {
    vi.mocked(api.crudify)
      .mockResolvedValueOnce({ loc: 5 } as never)
      .mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() =>
      useCrudGeneration(context({ verbs: new Set(['post', 'get', 'put']), guided: true })),
    );

    await act(() => result.current.generate());

    expect(api.crudify).toHaveBeenCalledTimes(2);
    expect(messages(result.current.feed)).toEqual([
      'information: POST orders — 1 endpoint, 5 lines',
      'error: GET orders — boom',
      'warning: 1 endpoints were generated before the failure.',
    ]);
    expect(result.current.busy).toBe(false);
    // No done panel after a failure, even in the guided flow.
    act(() => result.current.closeFeed());
    expect(result.current.done).toBeNull();
  });

  it('keeps what was generated when cancelled between calls', async () => {
    const { result } = renderHook(() =>
      useCrudGeneration(context({ verbs: new Set(['post', 'get']) })),
    );
    vi.mocked(api.crudify).mockImplementationOnce(() => {
      result.current.requestCancel();
      return Promise.resolve({ loc: 3 } as never);
    });

    await act(() => result.current.generate());

    expect(api.crudify).toHaveBeenCalledTimes(1);
    expect(messages(result.current.feed)).toEqual([
      'information: POST orders — 1 endpoint, 3 lines',
      'warning: Cancelled — the 1 endpoints generated so far are kept.',
    ]);
  });

  it('shows the done panel after the finished feed is closed in the guided flow', async () => {
    const base = context({ guided: true });
    const { result } = renderHook(() =>
      useCrudGeneration({ ...base, options: { ...base.options, moduleName: 'custom' } }),
    );

    await act(() => result.current.generate());
    expect(result.current.done).toBeNull();
    expect(result.current.feed).not.toBeNull();

    act(() => result.current.closeFeed());

    expect(result.current.feed).toBeNull();
    expect(result.current.done).toEqual({ generated: 1, loc: 12, module: 'custom' });
    act(() => result.current.setDone(null));
    expect(result.current.done).toBeNull();
  });

  it('treats closing a running feed as a cancel request', async () => {
    let finish: (value: never) => void = () => {
      // replaced when crudify is called
    };
    vi.mocked(api.crudify).mockImplementation(
      () =>
        new Promise(resolve => {
          finish = resolve;
        }),
    );
    const { result } = renderHook(() =>
      useCrudGeneration(context({ verbs: new Set(['post', 'get']) })),
    );

    let running: Promise<void> = Promise.resolve();
    act(() => {
      running = result.current.generate();
    });
    expect(result.current.busy).toBe(true);
    expect(result.current.progressText).toBe('1 of 2');

    act(() => result.current.closeFeed());
    // Still open: closing only asks the loop to stop.
    expect(result.current.feed).not.toBeNull();

    await act(async () => {
      finish({ loc: 1 } as never);
      await running;
    });

    expect(api.crudify).toHaveBeenCalledTimes(1);
    expect(messages(result.current.feed).at(-1)).toContain('Cancelled');
    expect(result.current.busy).toBe(false);
  });
});
