// @vitest-environment jsdom
/*
 * useCatalogs: creating, listing and deleting the databases (catalogs) of an external
 * connection, with name validation and a typed-name confirmation for deletes.
 */
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { DialogContext } from '../../../lib/useDialog';
import { useCatalogs } from '../hooks/useCatalogs';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

const toasts: Toast[] = [];
const dialog = {
  confirm: vi.fn(),
  confirmTyped: vi.fn(),
  prompt: vi.fn<() => Promise<string | null>>(),
  form: vi.fn(),
  choice: vi.fn(),
};
const wrapper = ({ children }: { children: ReactNode }) => (
  <DialogContext.Provider value={dialog}>{children}</DialogContext.Provider>
);
const row = { type: 'mysql', name: 'shop', connectionString: 'x', status: 'live' as const };

beforeEach(() => {
  toasts.length = 0;
  setToastListener(toast => toasts.push(toast));
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

function mount() {
  const setBusy = vi.fn();
  const hook = renderHook(() => useCatalogs(setBusy), { wrapper });
  return { setBusy, ...hook };
}

describe('createCatalog', () => {
  it('does nothing when the prompt is dismissed', async () => {
    dialog.prompt.mockResolvedValue(null);
    const { result } = mount();
    await act(() => result.current.createCatalog(row));
    expect(api.createDatabase).not.toHaveBeenCalled();
  });

  it('rejects a name with characters beyond alphanumerics and underscore', async () => {
    dialog.prompt.mockResolvedValue('my-db');
    const { result } = mount();
    await act(() => result.current.createCatalog(row));
    expect(api.createDatabase).not.toHaveBeenCalled();
    expect(toasts[0]).toMatchObject({
      text: 'Catalog names accept alphanumeric characters and _',
      isError: true,
    });
  });

  it('creates the catalog on the connection', async () => {
    dialog.prompt.mockResolvedValue('sales_2024');
    const { result, setBusy } = mount();
    await act(() => result.current.createCatalog(row));
    expect(api.createDatabase).toHaveBeenCalledWith('mysql', 'shop', 'sales_2024');
    expect(toasts[0]).toMatchObject({ text: 'Catalog sales_2024 created', isError: false });
    expect(setBusy.mock.calls).toEqual([[true], [false]]);
  });

  it('reports a failed creation and releases busy', async () => {
    dialog.prompt.mockResolvedValue('sales');
    vi.mocked(api.createDatabase).mockRejectedValue(new Error('exists'));
    const { result, setBusy } = mount();
    await act(() => result.current.createCatalog(row));
    expect(toasts[0]).toMatchObject({ text: 'exists', isError: true });
    expect(setBusy).toHaveBeenLastCalledWith(false);
  });
});

describe('manageCatalogs', () => {
  it('lists the catalogs of the connection', async () => {
    vi.mocked(api.listDatabases).mockResolvedValue({
      databases: [{ name: 'a' }, { name: 'b' }],
    });
    const { result } = mount();
    await act(() => result.current.manageCatalogs(row));
    expect(api.listDatabases).toHaveBeenCalledWith('mysql', 'shop');
    expect(result.current.catalogs).toEqual({ row, list: [{ name: 'a' }, { name: 'b' }] });
    expect(result.current.managing).toBeNull();
  });

  it('shows an empty list when the server returns no databases', async () => {
    vi.mocked(api.listDatabases).mockResolvedValue({} as never);
    const { result } = mount();
    await act(() => result.current.manageCatalogs(row));
    expect(result.current.catalogs?.list).toEqual([]);
  });

  it('marks the connection as being managed while the request is in flight', async () => {
    let finish: () => void = () => {
      // replaced once the request is in flight
    };
    vi.mocked(api.listDatabases).mockImplementation(
      () =>
        new Promise(resolve => {
          finish = () => resolve({ databases: [] });
        }),
    );
    const { result } = mount();
    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.manageCatalogs(row);
    });
    expect(result.current.managing).toBe('mysql/shop');
    await act(async () => {
      finish();
      await pending;
    });
    expect(result.current.managing).toBeNull();
  });

  it('reports a failed listing and leaves no dialog open', async () => {
    vi.mocked(api.listDatabases).mockRejectedValue(new Error('refused'));
    const { result } = mount();
    await act(() => result.current.manageCatalogs(row));
    expect(result.current.catalogs).toBeNull();
    expect(toasts[0].text).toBe('refused');
    expect(result.current.managing).toBeNull();
  });

  it('can close the catalog dialog', async () => {
    vi.mocked(api.listDatabases).mockResolvedValue({ databases: [] });
    const { result } = mount();
    await act(() => result.current.manageCatalogs(row));
    act(() => result.current.setCatalogs(null));
    expect(result.current.catalogs).toBeNull();
  });
});

describe('removeCatalog', () => {
  it('does nothing quietly when the prompt is dismissed', async () => {
    dialog.prompt.mockResolvedValue(null);
    const { result } = mount();
    await act(() => result.current.removeCatalog(row, 'sales'));
    expect(api.dropDatabase).not.toHaveBeenCalled();
    expect(toasts).toHaveLength(0);
  });

  it('warns when the typed name differs from the catalog', async () => {
    dialog.prompt.mockResolvedValue('sale');
    const { result } = mount();
    await act(() => result.current.removeCatalog(row, 'sales'));
    expect(api.dropDatabase).not.toHaveBeenCalled();
    expect(toasts[0]).toMatchObject({
      text: 'Name did not match — nothing deleted',
      isError: true,
    });
  });

  it('drops the catalog and reloads the list', async () => {
    dialog.prompt.mockResolvedValue('sales');
    vi.mocked(api.listDatabases).mockResolvedValue({ databases: [{ name: 'other' }] });
    const { result, setBusy } = mount();
    await act(() => result.current.removeCatalog(row, 'sales'));
    expect(api.dropDatabase).toHaveBeenCalledWith('mysql', 'shop', 'sales');
    expect(result.current.catalogs?.list).toEqual([{ name: 'other' }]);
    expect(setBusy).toHaveBeenLastCalledWith(false);
  });

  it('reports a failed drop', async () => {
    dialog.prompt.mockResolvedValue('sales');
    vi.mocked(api.dropDatabase).mockRejectedValue(new Error('locked'));
    const { result } = mount();
    await act(() => result.current.removeCatalog(row, 'sales'));
    expect(toasts[0].text).toBe('locked');
    expect(api.listDatabases).not.toHaveBeenCalled();
  });
});
