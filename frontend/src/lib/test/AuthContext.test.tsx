// @vitest-environment jsdom
/*
 * Tests for the authentication provider: initial state from storage and the ?backend= link,
 * login, logout and ticket sign-in, switching backends, the root-only status and version checks,
 * and every way a session ends (expired token, rejected token, 401, failed refresh).
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fakeToken } from '../../test/renderPage';
import * as api from '../api';
import { AuthProvider } from '../AuthContext';
import { loadBackend, loadBackends, type StoredBackend } from '../backend';
import { setToastListener, type Toast } from '../toast';
import { useAuth } from '../useAuth';

let unauthorized: (() => void) | null = null;

vi.mock('../api', async importOriginal => {
  const mocked = (await import('../../test/apiMock')).mockApi(await importOriginal());
  mocked.configureApi = vi.fn();
  mocked.setUnauthorizedHandler = vi.fn((handler: (() => void) | null) => {
    unauthorized = handler;
  });
  return mocked;
});

const mocked = vi.mocked(api);

const URL_A = 'https://a.test';
const URL_B = 'https://b.test';
const nowSeconds = () => Math.floor(Date.now() / 1000);

function rootToken(extra: Record<string, unknown> = {}) {
  return fakeToken({
    unique_name: 'root',
    role: ['root'],
    exp: nowSeconds() + 3600,
    ...extra,
  });
}

function guestToken() {
  return fakeToken({ unique_name: 'guest', role: 'guest', exp: nowSeconds() + 3600 });
}

function expiredToken() {
  return fakeToken({ unique_name: 'root', role: ['root'], exp: nowSeconds() - 10 });
}

function store(list: StoredBackend[], active = list[0]?.url) {
  localStorage.setItem('magic2.backends', JSON.stringify(list));
  if (active) {
    localStorage.setItem('magic2.active-backend', active);
  }
}

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return <AuthProvider>{children}</AuthProvider>;
}

function mount() {
  return renderHook(() => useAuth(), { wrapper });
}

let toasts: Toast[] = [];

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  globalThis.history.replaceState(null, '', '/');
  vi.clearAllMocks();
  unauthorized = null;
  mocked.verifyTicket.mockResolvedValue(true);
  mocked.getStatus.mockResolvedValue({ result: true } as never);
  mocked.getVersion.mockResolvedValue({ version: 'v9.9.9' });
  mocked.refreshTicket.mockResolvedValue({ ticket: 'unused' });
  toasts = [];
  setToastListener(toast => toasts.push(toast));
});

afterEach(() => {
  setToastListener(null);
  vi.useRealTimers();
});

describe('initial state', () => {
  it('is signed out with no stored backend, and points the api at nothing', () => {
    const { result } = mount();
    expect(result.current.backend).toBeNull();
    expect(result.current.authenticated).toBe(false);
    expect(result.current.isRoot).toBe(false);
    expect(result.current.setupNeeded).toBeNull();
    expect(result.current.version).toBe('…');
    expect(mocked.configureApi).toHaveBeenCalledWith('', null);
    expect(mocked.verifyTicket).not.toHaveBeenCalled();
  });

  it('restores a stored root session and configures the api with its token', async () => {
    const token = rootToken();
    store([{ url: URL_A, username: 'root', token }]);
    const { result } = mount();
    expect(result.current.authenticated).toBe(true);
    expect(result.current.isRoot).toBe(true);
    expect(mocked.configureApi).toHaveBeenCalledWith(URL_A, token);
    await waitFor(() => expect(result.current.version).toBe('v9.9.9'));
    expect(mocked.verifyTicket).toHaveBeenCalled();
  });

  it('fills in the username from the token when none was stored', () => {
    store([{ url: URL_A, username: '', token: rootToken() }]);
    const { result } = mount();
    expect(result.current.backend?.username).toBe('root');
  });

  it('discards an expired token at start without asking the backend about it', () => {
    store([{ url: URL_A, username: 'root', token: expiredToken() }]);
    const { result } = mount();
    expect(result.current.authenticated).toBe(false);
    expect(result.current.backend?.url).toBe(URL_A);
    expect(result.current.backend?.token).toBeNull();
    expect(mocked.configureApi).toHaveBeenCalledWith(URL_A, null);
    expect(mocked.verifyTicket).not.toHaveBeenCalled();
    expect(mocked.getStatus).not.toHaveBeenCalled();
  });

  it('a ?backend= link wins over the stored active backend and is removed from the address', async () => {
    store([{ url: URL_A, username: 'root', token: rootToken() }]);
    globalThis.history.replaceState(null, '', '/page?backend=' + URL_B + '&keep=1');
    const { result } = mount();
    expect(result.current.backend?.url).toBe(URL_B);
    expect(result.current.authenticated).toBe(false);
    await waitFor(() => expect(globalThis.location.search).toBe('?keep=1'));
    expect(globalThis.location.pathname).toBe('/page');
  });

  it('removes a lone ?backend= parameter completely', async () => {
    globalThis.history.replaceState(null, '', '/?backend=' + URL_B);
    mount();
    await waitFor(() => expect(globalThis.location.search).toBe(''));
  });
});

describe('root-only status and version', () => {
  it('asks for setup status when root, and needs setup when the backend says not configured', async () => {
    mocked.getStatus.mockResolvedValue({ result: false } as never);
    store([{ url: URL_A, username: 'root', token: rootToken() }]);
    const { result } = mount();
    await waitFor(() => expect(result.current.setupNeeded).toBe(true));
  });

  it('does not need setup when the backend is configured', async () => {
    store([{ url: URL_A, username: 'root', token: rootToken() }]);
    const { result } = mount();
    await waitFor(() => expect(result.current.setupNeeded).toBe(false));
  });

  it('does not trap anyone on setup when the status cannot be read', async () => {
    mocked.getStatus.mockRejectedValue(new Error('offline'));
    store([{ url: URL_A, username: 'root', token: rootToken() }]);
    const { result } = mount();
    await waitFor(() => expect(result.current.setupNeeded).toBe(false));
  });

  it('setupCompleted clears the setup requirement', async () => {
    mocked.getStatus.mockResolvedValue({ result: false } as never);
    store([{ url: URL_A, username: 'root', token: rootToken() }]);
    const { result } = mount();
    await waitFor(() => expect(result.current.setupNeeded).toBe(true));
    act(() => result.current.setupCompleted());
    expect(result.current.setupNeeded).toBe(false);
  });

  it('a non-root user is authenticated but nothing root-only is called', async () => {
    store([{ url: URL_A, username: 'guest', token: guestToken() }]);
    const { result } = mount();
    expect(result.current.authenticated).toBe(true);
    expect(result.current.isRoot).toBe(false);
    expect(result.current.setupNeeded).toBeNull();
    await waitFor(() => expect(mocked.verifyTicket).toHaveBeenCalled());
    expect(mocked.getStatus).not.toHaveBeenCalled();
    expect(mocked.getVersion).not.toHaveBeenCalled();
    expect(result.current.version).toBe('…');
  });

  it('shows a question mark when the version cannot be read', async () => {
    mocked.getVersion.mockRejectedValue(new Error('older backend'));
    store([{ url: URL_A, username: 'root', token: rootToken() }]);
    const { result } = mount();
    await waitFor(() => expect(result.current.version).toBe('?'));
  });
});

describe('token verification', () => {
  it('signs out and saves the cleared token when the backend rejects the stored one', async () => {
    mocked.verifyTicket.mockResolvedValue(false);
    store([{ url: URL_A, username: 'root', token: rootToken() }]);
    const { result } = mount();
    await waitFor(() => expect(result.current.authenticated).toBe(false));
    expect(result.current.backend?.url).toBe(URL_A);
    expect(mocked.configureApi).toHaveBeenLastCalledWith(URL_A, null);
    expect(loadBackend()?.token).toBeNull();
  });

  it('keeps the session when the backend cannot be reached to verify it', async () => {
    mocked.verifyTicket.mockRejectedValue(new Error('offline'));
    store([{ url: URL_A, username: 'root', token: rootToken() }]);
    const { result } = mount();
    await waitFor(() => expect(mocked.verifyTicket).toHaveBeenCalled());
    expect(result.current.authenticated).toBe(true);
  });
});

describe('login', () => {
  it('authenticates, strips trailing slashes, stores the backend and configures the api', async () => {
    mocked.authenticate.mockResolvedValue({ ticket: rootToken() });
    const { result } = mount();
    await act(() => result.current.login(URL_A + '//', 'root', 'secret'));
    expect(mocked.authenticate).toHaveBeenCalledWith(URL_A, 'root', 'secret');
    expect(result.current.authenticated).toBe(true);
    expect(result.current.backend?.url).toBe(URL_A);
    expect(result.current.backend?.username).toBe('root');
    expect(loadBackend()?.token).toBe(result.current.backend?.token);
    expect(result.current.backends.map(b => b.url)).toEqual([URL_A]);
    expect(mocked.configureApi).toHaveBeenLastCalledWith(URL_A, result.current.backend?.token);
  });

  it('a failed login rejects and leaves the user signed out and nothing stored', async () => {
    mocked.authenticate.mockRejectedValue(new api.ApiError(401, 'bad credentials'));
    const { result } = mount();
    await act(async () => {
      await expect(result.current.login(URL_A, 'root', 'wrong')).rejects.toMatchObject({
        status: 401,
      });
    });
    expect(result.current.authenticated).toBe(false);
    expect(result.current.backend).toBeNull();
    expect(loadBackends()).toEqual([]);
  });

  it('loginWithTicket signs in as the ticket owner', () => {
    const ticket = rootToken({ unique_name: 'alice' });
    const { result } = mount();
    act(() => result.current.loginWithTicket(URL_A + '/', ticket));
    expect(result.current.authenticated).toBe(true);
    expect(result.current.backend).toEqual({ url: URL_A, username: 'alice', token: ticket });
    expect(loadBackend()?.token).toBe(ticket);
  });
});

describe('logout and switching', () => {
  it('logout drops the token but keeps the backend to sign back into', () => {
    store([{ url: URL_A, username: 'root', token: rootToken() }]);
    const { result } = mount();
    act(() => result.current.logout());
    expect(result.current.authenticated).toBe(false);
    expect(result.current.backend?.url).toBe(URL_A);
    expect(mocked.configureApi).toHaveBeenLastCalledWith(URL_A, null);
    expect(loadBackends()).toEqual([expect.objectContaining({ url: URL_A, token: null })]);
  });

  it('logout while signed out does nothing', () => {
    const { result } = mount();
    act(() => result.current.logout());
    expect(result.current.backend).toBeNull();
  });

  it('forgets the setup answer when root signs out', async () => {
    store([{ url: URL_A, username: 'root', token: rootToken() }]);
    const { result } = mount();
    await waitFor(() => expect(result.current.setupNeeded).toBe(false));
    act(() => result.current.logout());
    expect(result.current.setupNeeded).toBeNull();
    expect(result.current.version).toBe('…');
  });

  it('switchBackend moves to another signed-in backend with its token', () => {
    const tokenB = rootToken({ unique_name: 'bob' });
    store([
      { url: URL_A, username: 'root', token: rootToken() },
      { url: URL_B, username: 'bob', token: tokenB },
    ]);
    const { result } = mount();
    act(() => result.current.switchBackend(URL_B));
    expect(result.current.backend?.url).toBe(URL_B);
    expect(result.current.authenticated).toBe(true);
    expect(mocked.configureApi).toHaveBeenLastCalledWith(URL_B, tokenB);
  });

  it('switchBackend to a backend whose token has expired lands on its login', () => {
    store([
      { url: URL_A, username: 'root', token: rootToken() },
      { url: URL_B, username: 'bob', token: expiredToken() },
    ]);
    const { result } = mount();
    act(() => result.current.switchBackend(URL_B));
    expect(result.current.backend).toMatchObject({ url: URL_B, token: null });
    expect(result.current.authenticated).toBe(false);
  });

  it('switchBackend to an unknown backend changes nothing', () => {
    store([{ url: URL_A, username: 'root', token: rootToken() }]);
    const { result } = mount();
    act(() => result.current.switchBackend('https://nowhere.test'));
    expect(result.current.backend?.url).toBe(URL_A);
  });

  it('removeBackend forgets the active one and falls back to the next', () => {
    store([
      { url: URL_A, username: 'root', token: rootToken() },
      { url: URL_B, username: 'bob', token: rootToken({ unique_name: 'bob' }) },
    ]);
    const { result } = mount();
    act(() => result.current.removeBackend(URL_A));
    expect(result.current.backend?.url).toBe(URL_B);
    expect(result.current.backends.map(b => b.url)).toEqual([URL_B]);
  });

  it('removing the last backend leaves nothing connected', () => {
    store([{ url: URL_A, username: 'root', token: rootToken() }]);
    const { result } = mount();
    act(() => result.current.removeBackend(URL_A));
    expect(result.current.backend).toBeNull();
    expect(mocked.configureApi).toHaveBeenLastCalledWith('', null);
  });

  it('addBackend shows the login screen but keeps the stored backends', () => {
    store([{ url: URL_A, username: 'root', token: rootToken() }]);
    const { result } = mount();
    act(() => result.current.addBackend());
    expect(result.current.backend).toBeNull();
    expect(result.current.authenticated).toBe(false);
    expect(loadBackends()).toHaveLength(1);
    expect(loadBackend()).toBeNull();
  });
});

describe('401 from the backend', () => {
  it('drops the token once, saves it and tells the user', () => {
    store([{ url: URL_A, username: 'root', token: rootToken() }]);
    const { result } = mount();
    expect(unauthorized).toBeTypeOf('function');
    act(() => unauthorized?.());
    expect(result.current.authenticated).toBe(false);
    expect(loadBackend()?.token).toBeNull();
    expect(mocked.configureApi).toHaveBeenLastCalledWith(URL_A, null);
    expect(toasts).toHaveLength(1);
    expect(toasts[0].isError).toBe(true);
    expect(toasts[0].text).toContain('no longer valid');
    // A second 401 from a request already in flight must not toast again.
    act(() => unauthorized?.());
    expect(toasts).toHaveLength(1);
  });

  it('unregisters its handler when unmounted', () => {
    const { unmount } = mount();
    expect(unauthorized).toBeTypeOf('function');
    unmount();
    expect(unauthorized).toBeNull();
  });
});

describe('token refresh', () => {
  const NOW = new Date('2026-01-01T00:00:00Z');

  function tokenExpiringIn(seconds: number) {
    return fakeToken({
      unique_name: 'root',
      role: ['root'],
      exp: Math.floor(NOW.getTime() / 1000) + seconds,
    });
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    vi.setSystemTime(NOW);
  });

  it('refreshes one minute before expiry and stores the new token', async () => {
    const fresh = tokenExpiringIn(7200);
    mocked.refreshTicket.mockResolvedValue({ ticket: fresh });
    store([{ url: URL_A, username: 'root', token: tokenExpiringIn(300) }]);
    const { result } = mount();
    await act(() => vi.advanceTimersByTimeAsync(239_000));
    expect(mocked.refreshTicket).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(2_000));
    expect(mocked.refreshTicket).toHaveBeenCalledTimes(1);
    expect(result.current.backend?.token).toBe(fresh);
    expect(loadBackend()?.token).toBe(fresh);
    expect(mocked.configureApi).toHaveBeenLastCalledWith(URL_A, fresh);
  });

  it('refreshes immediately when the token is less than a minute from expiry', async () => {
    store([{ url: URL_A, username: 'root', token: tokenExpiringIn(30) }]);
    mount();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(mocked.refreshTicket).toHaveBeenCalledTimes(1);
  });

  it('retries every ten seconds while the token still works', async () => {
    mocked.refreshTicket.mockRejectedValue(new Error('network'));
    store([{ url: URL_A, username: 'root', token: tokenExpiringIn(300) }]);
    const { result } = mount();
    await act(() => vi.advanceTimersByTimeAsync(241_000));
    expect(mocked.refreshTicket).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTimeAsync(10_000));
    expect(mocked.refreshTicket).toHaveBeenCalledTimes(2);
    expect(result.current.authenticated).toBe(true);
  });

  it('stops retrying once the token has expired', async () => {
    mocked.refreshTicket.mockRejectedValue(new Error('network'));
    store([{ url: URL_A, username: 'root', token: tokenExpiringIn(70) }]);
    mount();
    // Refresh fires at 10s; every retry fails until the token expires at 70s, then stops.
    await act(() => vi.advanceTimersByTimeAsync(200_000));
    const calls = mocked.refreshTicket.mock.calls.length;
    expect(calls).toBeGreaterThan(1);
    await act(() => vi.advanceTimersByTimeAsync(100_000));
    expect(mocked.refreshTicket).toHaveBeenCalledTimes(calls);
  });

  it('does not schedule a refresh for a token without an expiry', async () => {
    store([
      { url: URL_A, username: 'root', token: fakeToken({ unique_name: 'root', role: ['root'] }) },
    ]);
    mount();
    await act(() => vi.advanceTimersByTimeAsync(10_000_000));
    expect(mocked.refreshTicket).not.toHaveBeenCalled();
  });

  it('cancels the pending refresh on logout', async () => {
    store([{ url: URL_A, username: 'root', token: tokenExpiringIn(300) }]);
    const { result } = mount();
    act(() => result.current.logout());
    await act(() => vi.advanceTimersByTimeAsync(400_000));
    expect(mocked.refreshTicket).not.toHaveBeenCalled();
  });
});
