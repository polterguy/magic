// @vitest-environment jsdom
/*
 * useUserList: the paged, filtered, sorted user list, whether invites can be sent, typed-name
 * confirmed deletion and the CSV export of every matching user.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import * as download from '../../../lib/download';
import { setToastListener, type Toast } from '../../../lib/toast';
import { AuthContext } from '../../../lib/useAuth';
import { DialogContext } from '../../../lib/useDialog';
import { fakeAuth, TEST_BACKEND } from '../../../test/renderPage';
import { PAGE_SIZE } from '../constants';
import { useUserList } from '../hooks/useUserList';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);
vi.mock('../../../lib/download', async importOriginal => ({
  ...(await importOriginal<typeof import('../../../lib/download')>()),
  exportCsv: vi.fn(),
}));

const toasts: Toast[] = [];
const dialog = {
  confirm: vi.fn(),
  confirmTyped: vi.fn<() => Promise<boolean>>(),
  prompt: vi.fn(),
  form: vi.fn(),
  choice: vi.fn(),
};
const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthContext.Provider value={fakeAuth()}>
    <DialogContext.Provider value={dialog}>{children}</DialogContext.Provider>
  </AuthContext.Provider>
);

const USERS = [
  { username: 'alice', roles: ['admin'], created: '2024-01-01' },
  { username: 'google:bob@x.com', roles: ['guest', 'dev'] },
] as api.User[];

beforeEach(() => {
  toasts.length = 0;
  setToastListener(toast => toasts.push(toast));
  vi.mocked(api.canResetPassword).mockResolvedValue(true);
  vi.mocked(api.listUsers).mockResolvedValue(USERS);
  vi.mocked(api.countUsers).mockResolvedValue({ count: 2 });
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

async function mount() {
  const hook = renderHook(() => useUserList(), { wrapper });
  await waitFor(() => expect(hook.result.current.list.rows).not.toBeNull());
  return hook;
}

describe('list', () => {
  it('loads the first page with the count', async () => {
    const { result } = await mount();
    expect(api.listUsers).toHaveBeenCalledWith('', 0, PAGE_SIZE, {
      column: null,
      direction: 'asc',
    });
    expect(api.countUsers).toHaveBeenCalledWith('');
    expect(result.current.list.rows).toEqual(USERS);
    expect(result.current.list.count).toBe(2);
  });

  it('shows no rows when the server answers nothing', async () => {
    vi.mocked(api.listUsers).mockResolvedValue(undefined as never);
    const { result } = await mount();
    expect(result.current.list.rows).toEqual([]);
  });

  it('refetches with the new filter once typing settles', async () => {
    const { result } = await mount();
    act(() => result.current.setFilter('ali'));
    await waitFor(() =>
      expect(api.listUsers).toHaveBeenLastCalledWith('ali', 0, PAGE_SIZE, expect.anything()),
    );
    expect(api.countUsers).toHaveBeenLastCalledWith('ali');
  });

  it('refetches immediately when the sort changes', async () => {
    const { result } = await mount();
    act(() => result.current.setSort({ column: 'username', direction: 'desc' }));
    await waitFor(() =>
      expect(api.listUsers).toHaveBeenLastCalledWith('', 0, PAGE_SIZE, {
        column: 'username',
        direction: 'desc',
      }),
    );
  });
});

describe('canInvite', () => {
  it('is unknown, then true when the backend can send links', async () => {
    const { result } = renderHook(() => useUserList(), { wrapper });
    expect(result.current.canInvite).toBeNull();
    await waitFor(() => expect(result.current.canInvite).toBe(true));
  });

  it('asks the signed-in backend, once', async () => {
    const { result } = renderHook(() => useUserList(), { wrapper });
    await waitFor(() => expect(result.current.canInvite).toBe(true));
    expect(api.canResetPassword).toHaveBeenCalledTimes(1);
    expect(api.canResetPassword).toHaveBeenCalledWith(TEST_BACKEND.url);
  });

  it('is false when the backend cannot send links', async () => {
    vi.mocked(api.canResetPassword).mockResolvedValue(false);
    const { result } = renderHook(() => useUserList(), { wrapper });
    await waitFor(() => expect(result.current.canInvite).toBe(false));
  });
});

describe('removeUser', () => {
  it('requires the username to be typed back', async () => {
    dialog.confirmTyped.mockResolvedValue(false);
    const { result } = await mount();
    await act(() => result.current.removeUser('alice'));
    expect(dialog.confirmTyped).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Delete user?', expected: 'alice', label: 'Username' }),
    );
    expect(api.deleteUser).not.toHaveBeenCalled();
  });

  it('deletes the user, announces it and reloads the list', async () => {
    dialog.confirmTyped.mockResolvedValue(true);
    const { result } = await mount();
    vi.mocked(api.listUsers).mockClear();
    await act(() => result.current.removeUser('alice'));
    expect(api.deleteUser).toHaveBeenCalledWith('alice');
    expect(toasts[0]).toMatchObject({ text: 'alice deleted', isError: false });
    await waitFor(() => expect(api.listUsers).toHaveBeenCalled());
    expect(result.current.waiting).toBe(false);
  });

  it('reports a failed delete and releases waiting', async () => {
    dialog.confirmTyped.mockResolvedValue(true);
    vi.mocked(api.deleteUser).mockRejectedValue(new Error('cannot delete root'));
    const { result } = await mount();
    await act(() => result.current.removeUser('root'));
    expect(toasts[0]).toMatchObject({ text: 'cannot delete root', isError: true });
    expect(result.current.waiting).toBe(false);
  });
});

describe('exportUsers', () => {
  it('fetches every user matching the filter and exports them as CSV rows', async () => {
    const { result } = await mount();
    act(() => result.current.setFilter('x'));
    await waitFor(() => expect(api.countUsers).toHaveBeenLastCalledWith('x'));
    await act(() => result.current.exportUsers());
    expect(api.listUsers).toHaveBeenLastCalledWith('x', 0, -1, { column: null, direction: 'asc' });
    expect(download.exportCsv).toHaveBeenCalledWith(
      [
        expect.objectContaining({ username: 'alice', roles: 'admin', created: '2024-01-01' }),
        expect.objectContaining({ username: 'bob@x.com', roles: 'guest, dev', created: '' }),
      ],
      'users.csv',
    );
    expect(result.current.waiting).toBe(false);
  });

  it('exports an empty set when the server answers nothing', async () => {
    const { result } = await mount();
    vi.mocked(api.listUsers).mockResolvedValue(undefined as never);
    await act(() => result.current.exportUsers());
    expect(download.exportCsv).toHaveBeenCalledWith([], 'users.csv');
  });

  it('reports a failed export', async () => {
    const { result } = await mount();
    vi.mocked(api.listUsers).mockRejectedValue(new Error('timeout'));
    await act(() => result.current.exportUsers());
    expect(download.exportCsv).not.toHaveBeenCalled();
    expect(toasts.at(-1)).toMatchObject({ text: 'timeout', isError: true });
    expect(result.current.waiting).toBe(false);
  });
});
