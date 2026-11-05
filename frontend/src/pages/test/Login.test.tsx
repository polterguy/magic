// @vitest-environment jsdom
/*
 * Login page: signs in with the typed backend, username and password, shows a failure, offers the
 * magic link flow and the OpenID providers the backend advertises, and refuses a provider that is
 * not fully configured.
 */
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import { renderPage } from '../../test/renderPage';
import Login from '../Login';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);

// The probes run on a 500 ms debounce, so waiting for their effects needs more than the default.
const SLOW = { timeout: 3000 };

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.mocked(api.canResetPassword).mockResolvedValue(false);
  vi.mocked(api.openidProviders).mockResolvedValue([]);
});

function renderLogin() {
  return renderPage(<Login />, { auth: { backend: null, authenticated: false } });
}

describe('Login', () => {
  it('signs in with the typed credentials', async () => {
    const { auth } = renderLogin();

    await userEvent.type(screen.getByLabelText(/^Password/), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(auth.login).toHaveBeenCalledWith(globalThis.location.origin, 'root', 'secret');
  });

  it('shows why a sign in failed', async () => {
    const { auth } = renderLogin();
    vi.mocked(auth.login).mockRejectedValue(new Error('Wrong password'));

    await userEvent.type(screen.getByLabelText(/^Password/), 'nope');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Wrong password')).toBeInTheDocument();
  });

  it('offers no magic link or providers when the backend has none', async () => {
    renderLogin();

    await screen.findByRole('button', { name: 'Sign in' });

    expect(screen.queryByRole('button', { name: 'Login using magic link' })).toBeNull();
    expect(screen.queryByText(/Continue with/)).toBeNull();
  });

  it('sends a magic link for the typed user', async () => {
    vi.mocked(api.canResetPassword).mockResolvedValue(true);
    vi.mocked(api.sendResetPasswordLink).mockResolvedValue({ result: 'Link sent' });
    renderLogin();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Login using magic link' }, SLOW),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Send link' }));

    expect(api.sendResetPasswordLink).toHaveBeenCalledWith(globalThis.location.origin, 'root');
    expect(await screen.findByText('Link sent')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Back to sign in' }));
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('refuses a provider that is not fully configured', async () => {
    vi.mocked(api.openidProviders).mockResolvedValue([{ name: 'Acme', issuer: 'https://acme' }]);
    renderLogin();

    await userEvent.click(await screen.findByRole('button', { name: 'Continue with Acme' }, SLOW));

    expect(screen.getByText('Acme is not fully configured on this backend')).toBeInTheDocument();
  });
});
