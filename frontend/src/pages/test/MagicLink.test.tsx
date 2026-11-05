// @vitest-environment jsdom
/*
 * MagicLink page: attaches the emailed token to the backend named in the link, verifies it, and
 * either marks the arrival and moves on or signs out when the token is rejected.
 */
import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import { renderPage, TEST_BACKEND } from '../../test/renderPage';
import MagicLink from '../MagicLink';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);

// The page reads the token from globalThis.location, so the test sets it through the History API.
function openWithToken(token: string) {
  globalThis.history.replaceState(null, '', '/authentication/magic-link?token=' + token);
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

afterEach(() => {
  globalThis.history.replaceState(null, '', '/');
});

describe('MagicLink', () => {
  it('shows the signing in message and attaches the token to the backend', () => {
    openWithToken('abc');
    const backend = { ...TEST_BACKEND, token: null };
    const { auth } = renderPage(<MagicLink />, { auth: { backend } });

    expect(screen.getByText('Signing you in…')).toBeInTheDocument();
    expect(auth.loginWithTicket).toHaveBeenCalledWith(TEST_BACKEND.url, 'abc');
    expect(api.verifyTicket).not.toHaveBeenCalled();
  });

  it('marks the arrival once the backend accepts the token', async () => {
    openWithToken('abc');
    vi.mocked(api.verifyTicket).mockResolvedValue(true);
    const backend = { ...TEST_BACKEND, token: 'abc' };
    const { auth } = renderPage(<MagicLink />, { auth: { backend } });

    await waitFor(() => expect(sessionStorage.getItem('magic2.magic-link-arrival')).toBe('1'));
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('signs out when the backend rejects the token', async () => {
    openWithToken('abc');
    vi.mocked(api.verifyTicket).mockResolvedValue(false);
    const backend = { ...TEST_BACKEND, token: 'abc' };
    const { auth } = renderPage(<MagicLink />, { auth: { backend } });

    await waitFor(() => expect(auth.logout).toHaveBeenCalled());
    expect(sessionStorage.getItem('magic2.magic-link-arrival')).toBeNull();
  });

  it('signs out when verification fails', async () => {
    openWithToken('abc');
    vi.mocked(api.verifyTicket).mockRejectedValue(new Error('offline'));
    const backend = { ...TEST_BACKEND, token: 'abc' };
    const { auth } = renderPage(<MagicLink />, { auth: { backend } });

    await waitFor(() => expect(auth.logout).toHaveBeenCalled());
  });
});
