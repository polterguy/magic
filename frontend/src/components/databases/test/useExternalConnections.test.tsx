// @vitest-environment jsdom
/*
 * useExternalConnections: connection strings read from the configuration with a live/down
 * status each, and testing, adding and deleting them behind validation and confirmations.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { DialogContext } from '../../../lib/useDialog';
import { useExternalConnections } from '../hooks/useExternalConnections';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

const toasts: Toast[] = [];
const dialog = {
  confirm: vi.fn<() => Promise<boolean>>(),
  confirmTyped: vi.fn(),
  prompt: vi.fn<() => Promise<string | null>>(),
  form: vi.fn(),
  choice: vi.fn(),
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <DialogContext.Provider value={dialog}>{children}</DialogContext.Provider>
);

const CONFIG = {
  magic: {
    databases: {
      default: 'sqlite',
      mysql: { shop: 'Server=a;Database={database}' },
      pgsql: { crm: 'Host=b;Database={database}' },
    },
  },
};

beforeEach(() => {
  toasts.length = 0;
  setToastListener(toast => toasts.push(toast));
  vi.mocked(api.loadConfig).mockResolvedValue(CONFIG);
  vi.mocked(api.testConnectionString).mockResolvedValue({ result: 'success' });
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

async function mount() {
  const hook = renderHook(() => useExternalConnections(), { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

describe('loading', () => {
  it('lists the configured connections and tests each for a status', async () => {
    vi.mocked(api.testConnectionString).mockImplementation(type =>
      Promise.resolve({ result: type === 'mysql' ? 'success' : 'failure' }),
    );
    const { result } = await mount();
    await waitFor(() => expect(result.current.rows.every(row => row.status)).toBe(true));
    expect(result.current.rows).toEqual([
      expect.objectContaining({ type: 'mysql', name: 'shop', status: 'live' }),
      expect.objectContaining({ type: 'pgsql', name: 'crm', status: 'down' }),
    ]);
    expect(api.testConnectionString).toHaveBeenCalledWith('mysql', 'Server=a;Database={database}');
  });

  it('marks a connection down when its test throws', async () => {
    vi.mocked(api.testConnectionString).mockRejectedValue(new Error('timeout'));
    const { result } = await mount();
    await waitFor(() => expect(result.current.rows.every(row => row.status === 'down')).toBe(true));
    expect(toasts).toHaveLength(0);
  });

  it('reports a configuration that cannot be loaded and stops loading', async () => {
    vi.mocked(api.loadConfig).mockRejectedValue(new Error('no config'));
    const { result } = await mount();
    expect(result.current.rows).toEqual([]);
    expect(toasts[0]).toMatchObject({ text: 'no config', isError: true });
  });
});

describe('testOrConnect', () => {
  async function filled(name: string, connectionString: string, type = 'mysql') {
    const hook = await mount();
    act(() => {
      hook.result.current.setType(type);
      hook.result.current.setName(name);
      hook.result.current.setConnectionString(connectionString);
    });
    return hook;
  }

  it('refuses invalid input before touching the server', async () => {
    const { result } = await filled('', '');
    vi.mocked(api.testConnectionString).mockClear();
    await act(() => result.current.testOrConnect(true));
    expect(toasts[0]).toMatchObject({
      text: 'Give the connection a name and a connection string',
      isError: true,
    });
    expect(api.testConnectionString).not.toHaveBeenCalled();
  });

  it('refuses a name that is already used for the type', async () => {
    const { result } = await filled('shop', 'Server=x;Database={database}');
    await act(() => result.current.testOrConnect(true));
    expect(toasts[0].text).toBe('That name is already in use for mysql');
  });

  it('only reports success when just testing', async () => {
    const { result } = await filled('new', 'Server=x;Database={database}');
    await act(() => result.current.testOrConnect(false));
    expect(toasts.at(-1)).toMatchObject({ text: 'Connection succeeded', isError: false });
    expect(api.addConnectionString).not.toHaveBeenCalled();
    expect(result.current.busy).toBe(false);
  });

  it('shows the server message when the test fails', async () => {
    const { result } = await filled('new', 'Server=x;Database={database}');
    vi.mocked(api.testConnectionString).mockResolvedValue({
      result: 'failure',
      message: 'bad password',
    });
    await act(() => result.current.testOrConnect(true));
    expect(toasts.at(-1)).toMatchObject({ text: 'bad password', isError: true });
    expect(api.addConnectionString).not.toHaveBeenCalled();
  });

  it('falls back to a generic message when the failure carries none', async () => {
    const { result } = await filled('new', 'Server=x;Database={database}');
    vi.mocked(api.testConnectionString).mockResolvedValue({ result: 'failure' });
    await act(() => result.current.testOrConnect(true));
    expect(toasts.at(-1)?.text).toBe('Could not connect');
  });

  it('adds the connection, clears the form and refreshes the list', async () => {
    const { result } = await filled('analytics', 'Server=x;Database={database}');
    vi.mocked(api.loadConfig).mockClear();
    await act(() => result.current.testOrConnect(true));
    expect(dialog.confirm).not.toHaveBeenCalled();
    expect(api.addConnectionString).toHaveBeenCalledWith(
      'mysql',
      'analytics',
      'Server=x;Database={database}',
      false,
    );
    expect(toasts.at(-1)?.text).toBe('Connected — analytics added');
    expect(result.current.name).toBe('');
    expect(result.current.connectionString).toBe('');
    expect(api.loadConfig).toHaveBeenCalledTimes(1);
  });

  it('asks whether a "generic" connection becomes the default', async () => {
    dialog.confirm.mockResolvedValue(true);
    const { result } = await filled('generic', 'Server=x;Database={database}', 'pgsql');
    await act(() => result.current.testOrConnect(true));
    expect(dialog.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Use as default database?' }),
    );
    expect(api.addConnectionString).toHaveBeenCalledWith(
      'pgsql',
      'generic',
      'Server=x;Database={database}',
      true,
    );
  });

  it('reports a failure while adding and releases busy', async () => {
    const { result } = await filled('analytics', 'Server=x;Database={database}');
    vi.mocked(api.addConnectionString).mockRejectedValue(new Error('denied'));
    await act(() => result.current.testOrConnect(true));
    expect(toasts.at(-1)).toMatchObject({ text: 'denied', isError: true });
    expect(result.current.busy).toBe(false);
  });
});

describe('remove', () => {
  const row = { type: 'mysql', name: 'shop', connectionString: 'x', status: 'live' as const };

  it('does nothing when the prompt is dismissed', async () => {
    dialog.prompt.mockResolvedValue(null);
    const { result } = await mount();
    await act(() => result.current.remove(row));
    expect(api.deleteConnectionString).not.toHaveBeenCalled();
    expect(toasts).toHaveLength(0);
  });

  it('warns and deletes nothing when the typed name differs', async () => {
    dialog.prompt.mockResolvedValue('shp');
    const { result } = await mount();
    await act(() => result.current.remove(row));
    expect(api.deleteConnectionString).not.toHaveBeenCalled();
    expect(toasts[0]).toMatchObject({
      text: 'Name did not match — nothing deleted',
      isError: true,
    });
  });

  it('deletes the connection when its name is typed back, then refreshes', async () => {
    dialog.prompt.mockResolvedValue('shop');
    const { result } = await mount();
    vi.mocked(api.loadConfig).mockClear();
    await act(() => result.current.remove(row));
    expect(api.deleteConnectionString).toHaveBeenCalledWith('mysql', 'shop');
    expect(toasts.at(-1)).toMatchObject({ text: 'Connection shop deleted', isError: false });
    expect(api.loadConfig).toHaveBeenCalledTimes(1);
  });

  it('reports a failed delete', async () => {
    dialog.prompt.mockResolvedValue('shop');
    vi.mocked(api.deleteConnectionString).mockRejectedValue(new Error('in use'));
    const { result } = await mount();
    await act(() => result.current.remove(row));
    expect(toasts.at(-1)?.text).toBe('in use');
    expect(result.current.busy).toBe(false);
  });
});
