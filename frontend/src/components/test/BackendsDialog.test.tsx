// @vitest-environment jsdom
/*
 * BackendsDialog: the list of cloudlets signed into. Connected ones sort first, the filter
 * matches URL and username, switching asks the page's navigation guard first, forgetting asks
 * for confirmation, and "Forget signed out" clears every backend without a live token.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { StoredBackend } from '../../lib/backend';
import { setNavGuard } from '../../lib/navGuard';
import { setToastListener, type Toast } from '../../lib/toast';
import { fakeToken, renderPage } from '../../test/renderPage';
import BackendsDialog from '../BackendsDialog';

const LIVE = fakeToken({ unique_name: 'root', exp: Math.floor(Date.now() / 1000) + 3600 });
const EXPIRED = fakeToken({ unique_name: 'root', exp: Math.floor(Date.now() / 1000) - 3600 });

const BACKENDS: StoredBackend[] = [
  { url: 'https://zeta.test', token: LIVE, username: 'zoe' },
  { url: 'https://beta.test', token: EXPIRED, username: 'bob' },
  { url: 'https://alpha.test', token: null, username: '' },
  { url: 'https://gamma.test', token: LIVE, username: 'gina' },
];

let toasts: Toast[];

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
});

afterEach(() => {
  setToastListener(null);
  setNavGuard(null);
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

function renderDialog(backends = BACKENDS, active: StoredBackend | null = BACKENDS[0]) {
  const onClose = vi.fn();
  const view = renderPage(<BackendsDialog onClose={onClose} />, {
    auth: { backends, backend: active },
  });
  return { onClose, auth: view.auth };
}

// The rows of the table body, as the URLs they show, in display order.
function urls() {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map(row => within(row).queryByText(/^https:\/\//)?.textContent);
}

function rowOf(url: string) {
  return screen.getByText(url).closest('tr') as HTMLElement;
}

describe('BackendsDialog', () => {
  it('lists connected backends first, then the rest alphabetically, with their status', () => {
    renderDialog();
    expect(urls()).toEqual([
      'https://gamma.test',
      'https://zeta.test',
      'https://alpha.test',
      'https://beta.test',
    ]);
    expect(within(rowOf('https://gamma.test')).getByText('connected')).toBeInTheDocument();
    expect(within(rowOf('https://beta.test')).getByText('signed out')).toBeInTheDocument();
    expect(within(rowOf('https://alpha.test')).getByText('signed out')).toBeInTheDocument();
    expect(screen.getByText('4 of 4')).toBeInTheDocument();
  });

  it('filters by URL or username and says when nothing matches', async () => {
    renderDialog();
    const filter = screen.getByPlaceholderText('Filter backends…');

    await userEvent.type(filter, ' BOB ');
    expect(urls()).toEqual(['https://beta.test']);
    expect(screen.getByText('1 of 4')).toBeInTheDocument();

    await userEvent.clear(filter);
    await userEvent.type(filter, 'zeta');
    expect(urls()).toEqual(['https://zeta.test']);

    await userEvent.clear(filter);
    await userEvent.type(filter, 'nothing like it');
    expect(screen.getByText('Nothing matches that filter.')).toBeInTheDocument();
    expect(screen.getByText('0 of 4')).toBeInTheDocument();
  });

  it('marks the active backend and cannot switch to it', () => {
    renderDialog();
    const current = within(rowOf('https://zeta.test')).getByRole('button', { name: 'Current' });
    expect(current).toBeDisabled();
    expect(current).toHaveAttribute('title', 'This is the backend you are using');
    expect(
      within(rowOf('https://gamma.test')).getByRole('button', { name: 'Switch' }),
    ).toBeEnabled();
  });

  it('shows a dash for a backend without a username', () => {
    renderDialog();
    expect(within(rowOf('https://alpha.test')).getByText('—')).toBeInTheDocument();
  });

  it('switches and closes when no navigation guard objects', async () => {
    const { onClose, auth } = renderDialog();
    await userEvent.click(
      within(rowOf('https://gamma.test')).getByRole('button', { name: 'Switch' }),
    );
    await waitFor(() => expect(auth.switchBackend).toHaveBeenCalledWith('https://gamma.test'));
    expect(onClose).toHaveBeenCalled();
  });

  it('switches once the navigation guard allows it', async () => {
    const guard = vi.fn().mockResolvedValue(true);
    setNavGuard(guard);
    const { onClose, auth } = renderDialog();
    await userEvent.click(
      within(rowOf('https://gamma.test')).getByRole('button', { name: 'Switch' }),
    );
    await waitFor(() => expect(auth.switchBackend).toHaveBeenCalledWith('https://gamma.test'));
    expect(guard).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('stays put when the navigation guard objects', async () => {
    const guard = vi.fn().mockResolvedValue(false);
    setNavGuard(guard);
    const { onClose, auth } = renderDialog();
    await userEvent.click(
      within(rowOf('https://gamma.test')).getByRole('button', { name: 'Switch' }),
    );
    await waitFor(() => expect(guard).toHaveBeenCalled());
    expect(auth.switchBackend).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('copies a link that opens the dashboard against the backend', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    renderDialog();
    await userEvent.click(
      within(rowOf('https://gamma.test')).getByRole('button', {
        name: 'Copy link to this backend',
      }),
    );
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        globalThis.location.origin + '?backend=' + encodeURIComponent('https://gamma.test'),
      ),
    );
    await waitFor(() =>
      expect(toasts.some(toast => toast.text === 'The link can be found on your clipboard')).toBe(
        true,
      ),
    );
  });

  it('forgets a backend only after confirmation', async () => {
    const { auth } = renderDialog();
    const forget = within(rowOf('https://beta.test')).getByRole('button', {
      name: 'Forget this backend',
    });

    await userEvent.click(forget);
    expect(await screen.findByText('Forget https://beta.test?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.queryByText('Forget https://beta.test?')).not.toBeInTheDocument(),
    );
    expect(auth.removeBackend).not.toHaveBeenCalled();

    await userEvent.click(forget);
    await userEvent.click(await screen.findByRole('button', { name: 'Forget it' }));
    await waitFor(() => expect(auth.removeBackend).toHaveBeenCalledWith('https://beta.test'));
  });

  it('forgets every signed out backend after confirmation', async () => {
    const { auth } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Forget signed out (2)' }));
    expect(await screen.findByText('Forget 2 signed out backends?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Forget them' }));

    await waitFor(() => expect(auth.removeBackend).toHaveBeenCalledTimes(2));
    expect(auth.removeBackend).toHaveBeenCalledWith('https://alpha.test');
    expect(auth.removeBackend).toHaveBeenCalledWith('https://beta.test');
  });

  it('keeps the signed out backends when that confirmation is declined', async () => {
    const { auth } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Forget signed out (2)' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.queryByText('Forget 2 signed out backends?')).not.toBeInTheDocument(),
    );
    expect(auth.removeBackend).not.toHaveBeenCalled();
  });

  it('offers no bulk forget when every backend is connected', () => {
    renderDialog([BACKENDS[0], BACKENDS[3]]);
    expect(screen.queryByRole('button', { name: /Forget signed out/ })).not.toBeInTheDocument();
  });

  it('lists nothing and does not crash without any backend', () => {
    renderDialog([], null);
    expect(screen.getByText('Nothing matches that filter.')).toBeInTheDocument();
    expect(screen.getByText('0 of 0')).toBeInTheDocument();
  });

  it('closes with Close and starts a new sign-in with Add backend', async () => {
    const { onClose, auth } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'Add backend' }));
    expect(auth.addBackend).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
