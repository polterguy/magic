// @vitest-environment jsdom
/*
 * Login page, the parts Login.test.tsx leaves out: returning from an OpenID provider (refusal,
 * code and id_token exchanges, a lost pending sign-in), starting a provider sign-in, the dropdown
 * of previously used backends, the busy state, and the magic link and password reset failures.
 */
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import { rememberPendingOidc, saveBackend, takePendingOidc } from '../../lib/backend';
import { renderPage } from '../../test/renderPage';
import Login from '../Login';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);

// The probes run on a 500 ms debounce, so waiting for their effects needs more than the default.
const SLOW = { timeout: 3000 };

const PENDING = { backendUrl: 'https://cloudlet.test', returnPath: '/files?x=1' };

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  globalThis.history.replaceState(null, '', '/');
  vi.mocked(api.canResetPassword).mockResolvedValue(false);
  vi.mocked(api.openidProviders).mockResolvedValue([]);
});

afterEach(() => {
  vi.unstubAllGlobals();
  globalThis.history.replaceState(null, '', '/');
});

function renderLogin() {
  return renderPage(<Login />, { auth: { backend: null, authenticated: false } });
}

describe('Login returning from a provider', () => {
  it('shows why the provider refused the sign-in and drops the pending entry', async () => {
    rememberPendingOidc(PENDING);
    globalThis.history.replaceState(
      null,
      '',
      '/?error=access_denied&error_description=Not+allowed',
    );

    renderLogin();

    expect(
      await screen.findByText('The provider refused the sign-in: access_denied — Not allowed'),
    ).toBeInTheDocument();
    expect(takePendingOidc()).toBeNull();
    expect(globalThis.location.search).toBe('');
  });

  it('shows a refusal that carries no description as it is', async () => {
    globalThis.history.replaceState(null, '', '/?error=access_denied');

    renderLogin();

    expect(
      await screen.findByText('The provider refused the sign-in: access_denied'),
    ).toBeInTheDocument();
  });

  it('exchanges a code for a ticket and signs in with it', async () => {
    rememberPendingOidc(PENDING);
    vi.mocked(api.openidExchange).mockResolvedValue({ ticket: 'ticket-1' });
    globalThis.history.replaceState(null, '', '/?code=abc&state=xyz');

    const { auth } = renderLogin();

    await waitFor(() =>
      expect(auth.loginWithTicket).toHaveBeenCalledWith(PENDING.backendUrl, 'ticket-1'),
    );
    expect(api.openidExchange).toHaveBeenCalledWith(
      PENDING.backendUrl,
      'abc',
      'xyz',
      globalThis.location.origin + '/authentication/oidc-callback',
    );
    expect(api.openidLogin).not.toHaveBeenCalled();
    expect(globalThis.location.search).toBe('');
  });

  it('exchanges an id_token from the fragment for a ticket', async () => {
    rememberPendingOidc(PENDING);
    vi.mocked(api.openidLogin).mockResolvedValue({ ticket: 'ticket-2' });
    globalThis.history.replaceState(null, '', '/#id_token=tok-1&state=s');

    const { auth } = renderLogin();

    await waitFor(() =>
      expect(auth.loginWithTicket).toHaveBeenCalledWith(PENDING.backendUrl, 'ticket-2'),
    );
    expect(api.openidLogin).toHaveBeenCalledWith(PENDING.backendUrl, 'tok-1');
    expect(api.openidExchange).not.toHaveBeenCalled();
    expect(globalThis.location.hash).toBe('');
  });

  it('shows a failed exchange and lets the user try again', async () => {
    rememberPendingOidc(PENDING);
    vi.mocked(api.openidExchange).mockRejectedValue(new Error('Code expired'));
    globalThis.history.replaceState(null, '', '/?code=abc&state=xyz');

    const { auth } = renderLogin();

    expect(await screen.findByText('Code expired')).toBeInTheDocument();
    expect(auth.loginWithTicket).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });

  it('uses a generic message when the exchange fails without one', async () => {
    rememberPendingOidc(PENDING);
    vi.mocked(api.openidLogin).mockRejectedValue(undefined);
    globalThis.history.replaceState(null, '', '/#id_token=tok-1');

    renderLogin();

    expect(await screen.findByText('Could not complete sign-in')).toBeInTheDocument();
  });

  it('says so when it cannot tell which backend the sign-in was for', async () => {
    globalThis.history.replaceState(null, '', '/?code=abc&state=xyz');

    renderLogin();

    expect(
      await screen.findByText('Could not tell which backend this sign-in was for — try again'),
    ).toBeInTheDocument();
    expect(api.openidExchange).not.toHaveBeenCalled();
  });

  it('leaves a pending sign-in alone on an ordinary page load', async () => {
    rememberPendingOidc(PENDING);

    renderLogin();

    await screen.findByRole('button', { name: 'Sign in' });
    expect(takePendingOidc()).toEqual(PENDING);
    expect(api.openidExchange).not.toHaveBeenCalled();
  });
});

describe('Login starting a provider sign-in', () => {
  it('remembers the backend and the page, then goes to the provider', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', {
      origin: 'https://app.test',
      pathname: '/files',
      search: '?x=1',
      hash: '',
      assign,
    });
    vi.mocked(api.openidProviders).mockResolvedValue([
      {
        name: 'Acme',
        issuer: 'https://acme',
        url: 'https://acme.test/authorize',
        client_id: 'cid',
        nonce: 'n-1',
      },
    ]);
    renderLogin();

    await userEvent.click(await screen.findByRole('button', { name: 'Continue with Acme' }, SLOW));

    expect(takePendingOidc()).toEqual({ backendUrl: 'https://app.test', returnPath: '/files?x=1' });
    expect(assign).toHaveBeenCalledTimes(1);
    const target = new URL(assign.mock.calls[0][0] as string);
    expect(target.origin + target.pathname).toBe('https://acme.test/authorize');
    expect(target.searchParams.get('client_id')).toBe('cid');
    expect(target.searchParams.get('nonce')).toBe('n-1');
    expect(target.searchParams.get('redirect_uri')).toBe(
      'https://app.test/authentication/oidc-callback',
    );
  });
});

describe('Login backend picker', () => {
  beforeEach(() => {
    saveBackend({ url: 'https://one.test', token: null, username: 'root' });
    saveBackend({ url: 'https://two.test', token: null, username: 'root' });
  });

  it('starts empty when backends are already stored and offers them in a dropdown', async () => {
    renderLogin();

    const field = screen.getByPlaceholderText('http://localhost:5000');
    expect(field).toHaveValue('');
    await userEvent.click(screen.getByTitle('Backends you have signed in to'));

    const list = within(screen.getByText('https://one.test').parentElement!);
    expect(list.getByText('https://two.test')).toBeInTheDocument();
  });

  it('fills in the chosen backend and closes the dropdown', async () => {
    renderLogin();

    await userEvent.click(screen.getByTitle('Backends you have signed in to'));
    await userEvent.click(screen.getByRole('button', { name: 'https://one.test' }));

    expect(screen.getByPlaceholderText('http://localhost:5000')).toHaveValue('https://one.test');
    expect(screen.queryByRole('button', { name: 'https://two.test' })).toBeNull();
  });

  it('closes the dropdown when the user clicks elsewhere', async () => {
    renderLogin();

    await userEvent.click(screen.getByTitle('Backends you have signed in to'));
    expect(screen.getByRole('button', { name: 'https://one.test' })).toBeInTheDocument();
    fireEvent.mouseDown(document.body);

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'https://one.test' })).toBeNull(),
    );
  });

  it('keeps the dropdown open for a click inside it', async () => {
    renderLogin();

    await userEvent.click(screen.getByTitle('Backends you have signed in to'));
    fireEvent.mouseDown(screen.getByRole('button', { name: 'https://one.test' }));

    expect(screen.getByRole('button', { name: 'https://two.test' })).toBeInTheDocument();
  });

  it('closes the dropdown when its toggle is pressed again', async () => {
    renderLogin();

    await userEvent.click(screen.getByTitle('Backends you have signed in to'));
    await userEvent.click(screen.getByTitle('Backends you have signed in to'));

    expect(screen.queryByRole('button', { name: 'https://one.test' })).toBeNull();
  });
});

describe('Login while signing in', () => {
  it('disables the button and says it is signing in until the answer arrives', async () => {
    const { auth } = renderLogin();
    let finish: () => void = () => {
      // replaced as soon as login is called
    };
    vi.mocked(auth.login).mockReturnValue(
      new Promise<void>(resolve => {
        finish = resolve;
      }),
    );

    await userEvent.type(screen.getByLabelText(/^Password/), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled();
    finish();
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeEnabled();
  });

  it('uses the typed username and backend', async () => {
    const { auth } = renderLogin();

    const user = screen.getByLabelText(/^Username/);
    await userEvent.clear(user);
    await userEvent.type(user, 'alice');
    const url = screen.getByPlaceholderText('http://localhost:5000');
    await userEvent.clear(url);
    await userEvent.type(url, 'https://other.test');
    await userEvent.type(screen.getByLabelText(/^Password/), 'pw');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(auth.login).toHaveBeenCalledWith('https://other.test', 'alice', 'pw');
  });
});

describe('Login probing the backend', () => {
  it('keeps the magic link hidden when the reset probe fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {
      // the failure is expected and only needs to be reported, not printed
    });
    vi.mocked(api.canResetPassword).mockRejectedValue(new Error('unreachable'));

    renderLogin();

    await waitFor(() => expect(log).toHaveBeenCalled(), SLOW);
    expect(screen.queryByRole('button', { name: 'Login using magic link' })).toBeNull();
    log.mockRestore();
  });

  it('shows no providers when listing them fails', async () => {
    vi.mocked(api.openidProviders).mockRejectedValue(new Error('unreachable'));

    renderLogin();

    await waitFor(() => expect(api.openidProviders).toHaveBeenCalled(), SLOW);
    expect(screen.queryByText(/Continue with/)).toBeNull();
  });

  it('shows the providers the backend lists', async () => {
    vi.mocked(api.openidProviders).mockResolvedValue([
      { name: 'Acme', issuer: 'https://acme' },
      { name: 'Globex', issuer: 'https://globex' },
    ]);

    renderLogin();

    expect(
      await screen.findByRole('button', { name: 'Continue with Acme' }, SLOW),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with Globex' })).toBeInTheDocument();
  });
});

describe('Login magic link', () => {
  async function openMagicLink() {
    vi.mocked(api.canResetPassword).mockResolvedValue(true);
    renderLogin();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Login using magic link' }, SLOW),
    );
  }

  it('shows why the link could not be sent', async () => {
    vi.mocked(api.sendResetPasswordLink).mockRejectedValue(new Error('SMTP is down'));
    await openMagicLink();

    await userEvent.click(screen.getByRole('button', { name: 'Send link' }));

    expect(await screen.findByText('SMTP is down')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send link' })).toBeEnabled();
  });

  it('keeps Send link disabled for a blank user and sends for the one typed', async () => {
    vi.mocked(api.sendResetPasswordLink).mockResolvedValue({ result: 'Link sent' });
    await openMagicLink();

    const user = screen.getByLabelText(/^Username or email/);
    await userEvent.clear(user);
    expect(screen.getByRole('button', { name: 'Send link' })).toBeDisabled();
    await userEvent.type(user, '  alice@example.com ');
    await userEvent.click(screen.getByRole('button', { name: 'Send link' }));

    expect(api.sendResetPasswordLink).toHaveBeenCalledWith(
      globalThis.location.origin,
      'alice@example.com',
    );
    expect(await screen.findByText('Check your inbox')).toBeInTheDocument();
  });

  it('clears an earlier error when going back to sign in', async () => {
    vi.mocked(api.sendResetPasswordLink).mockRejectedValue(new Error('SMTP is down'));
    await openMagicLink();

    await userEvent.click(screen.getByRole('button', { name: 'Send link' }));
    await screen.findByText('SMTP is down');
    await userEvent.click(screen.getByRole('button', { name: 'Back to sign in' }));

    expect(screen.queryByText('SMTP is down')).toBeNull();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('starts from the username typed on the sign-in form', async () => {
    vi.mocked(api.canResetPassword).mockResolvedValue(true);
    renderLogin();
    const user = screen.getByLabelText(/^Username/);
    await userEvent.clear(user);
    await userEvent.type(user, 'alice');

    await userEvent.click(
      await screen.findByRole('button', { name: 'Login using magic link' }, SLOW),
    );

    expect(screen.getByLabelText(/^Username or email/)).toHaveValue('alice');
  });
});
