// @vitest-environment jsdom
/*
 * useSqliteDatabases: the internal SQLite databases, with create (name validation), delete
 * (typed-name confirmation) and backup upload (.db only).
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { DialogContext } from '../../../lib/useDialog';
import { useSqliteDatabases } from '../hooks/useSqliteDatabases';

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

beforeEach(() => {
  toasts.length = 0;
  setToastListener(toast => toasts.push(toast));
  vi.mocked(api.listDatabases).mockResolvedValue({ databases: [{ name: 'magic' }] });
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

async function mount() {
  const hook = renderHook(() => useSqliteDatabases(), { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

describe('loading', () => {
  it('lists the sqlite databases of the generic connection', async () => {
    const { result } = await mount();
    expect(api.listDatabases).toHaveBeenCalledWith('sqlite', 'generic');
    expect(result.current.databases).toEqual([{ name: 'magic' }]);
  });

  it('treats an answer without databases as an empty list', async () => {
    vi.mocked(api.listDatabases).mockResolvedValue({} as never);
    const { result } = await mount();
    expect(result.current.databases).toEqual([]);
  });

  it('reports a failed load and stops loading', async () => {
    vi.mocked(api.listDatabases).mockRejectedValue(new Error('unreachable'));
    const { result } = await mount();
    expect(result.current.databases).toEqual([]);
    expect(toasts[0]).toMatchObject({ text: 'unreachable', isError: true });
  });
});

describe('create', () => {
  it('rejects an invalid name without calling the server', async () => {
    const { result } = await mount();
    act(() => result.current.setName('bad name!'));
    await act(() => result.current.create());
    expect(api.createDatabase).not.toHaveBeenCalled();
    expect(toasts[0]).toMatchObject({
      text: 'Database names accept alphanumeric characters, - and _',
      isError: true,
    });
  });

  it('creates the database, clears the name and refreshes the list', async () => {
    const { result } = await mount();
    act(() => result.current.setName('sales-2024'));
    vi.mocked(api.listDatabases).mockClear();
    await act(() => result.current.create());
    expect(api.createDatabase).toHaveBeenCalledWith('sqlite', 'generic', 'sales-2024');
    expect(result.current.name).toBe('');
    expect(toasts.at(-1)).toMatchObject({ text: 'Database sales-2024 created', isError: false });
    expect(api.listDatabases).toHaveBeenCalledTimes(1);
    expect(result.current.busy).toBe(false);
  });

  it('reports a failed creation and keeps the name', async () => {
    vi.mocked(api.createDatabase).mockRejectedValue(new Error('exists'));
    const { result } = await mount();
    act(() => result.current.setName('sales'));
    await act(() => result.current.create());
    expect(toasts.at(-1)?.text).toBe('exists');
    expect(result.current.name).toBe('sales');
    expect(result.current.busy).toBe(false);
  });
});

describe('remove', () => {
  it('does nothing quietly when the prompt is dismissed', async () => {
    dialog.prompt.mockResolvedValue(null);
    const { result } = await mount();
    await act(() => result.current.remove('magic'));
    expect(api.dropDatabase).not.toHaveBeenCalled();
    expect(toasts).toHaveLength(0);
  });

  it('warns when the typed name differs', async () => {
    dialog.prompt.mockResolvedValue('mag');
    const { result } = await mount();
    await act(() => result.current.remove('magic'));
    expect(api.dropDatabase).not.toHaveBeenCalled();
    expect(toasts[0].text).toBe('Name did not match — nothing deleted');
  });

  it('drops the database when its name is typed back and refreshes', async () => {
    dialog.prompt.mockResolvedValue('magic');
    const { result } = await mount();
    vi.mocked(api.listDatabases).mockClear();
    await act(() => result.current.remove('magic'));
    expect(api.dropDatabase).toHaveBeenCalledWith('sqlite', 'generic', 'magic');
    expect(toasts.at(-1)).toMatchObject({ text: 'Database magic deleted', isError: false });
    expect(api.listDatabases).toHaveBeenCalledTimes(1);
  });

  it('reports a failed drop', async () => {
    dialog.prompt.mockResolvedValue('magic');
    vi.mocked(api.dropDatabase).mockRejectedValue(new Error('in use'));
    const { result } = await mount();
    await act(() => result.current.remove('magic'));
    expect(toasts.at(-1)?.text).toBe('in use');
    expect(result.current.busy).toBe(false);
  });
});

describe('upload', () => {
  it('accepts only .db backups', async () => {
    const { result } = await mount();
    await act(() => result.current.upload(new globalThis.File(['x'], 'backup.sql')));
    expect(api.uploadDatabaseBackup).not.toHaveBeenCalled();
    expect(toasts[0]).toMatchObject({ text: 'Backups must be .db files', isError: true });
  });

  it('uploads a .db backup and refreshes the list', async () => {
    const backup = new globalThis.File(['x'], 'magic.db');
    const { result } = await mount();
    vi.mocked(api.listDatabases).mockClear();
    await act(() => result.current.upload(backup));
    expect(api.uploadDatabaseBackup).toHaveBeenCalledWith(backup);
    expect(toasts.at(-1)).toMatchObject({ text: 'Backup magic.db uploaded', isError: false });
    expect(api.listDatabases).toHaveBeenCalledTimes(1);
  });

  it('reports a failed upload', async () => {
    vi.mocked(api.uploadDatabaseBackup).mockRejectedValue(new Error('corrupt'));
    const { result } = await mount();
    await act(() => result.current.upload(new globalThis.File(['x'], 'magic.db')));
    expect(toasts.at(-1)?.text).toBe('corrupt');
    expect(result.current.busy).toBe(false);
  });
});
