// @vitest-environment jsdom
/*
 * The application shell: navigation, collapse and phone drawer, theme, the Ctrl/Cmd shortcuts and
 * the overlays they open, guard-aware navigation, the toast stack and the socket feed behind it.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import { setNavGuard } from '../../lib/navGuard';
import {
  openChatOps,
  openPalette,
  refreshChat,
  setDashboardTourRunner,
} from '../../lib/shellActions';
import { openSupport } from '../../lib/support';
import { showToast } from '../../lib/toast';
import { fakeToken, renderPage, TEST_BACKEND } from '../../test/renderPage';
import Layout from '../Layout';
import { SECTIONS } from '../sections';

const socket = vi.hoisted(() => {
  const handlers: Record<string, (raw: string) => void> = {};
  const connection = {
    on: vi.fn((name: string, handler: (raw: string) => void) => {
      handlers[name] = handler;
    }),
    start: vi.fn(() => Promise.resolve()),
    stop: vi.fn(() => Promise.resolve()),
  };
  return { handlers, connection, createSocket: vi.fn(() => connection) };
});

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);
vi.mock('../../lib/socket', () => ({ createSocket: socket.createSocket }));
vi.mock('../../lib/support', () => ({ openSupport: vi.fn(() => Promise.resolve()) }));
vi.mock('../ChatDrawer', () => ({
  default: (props: { open: boolean; userId: string; onClose: () => void }) => (
    <div data-testid="chat" data-open={String(props.open)} data-user={props.userId}>
      <button onClick={props.onClose}>close chat</button>
    </div>
  ),
}));
vi.mock('../BackendsDialog', () => ({
  default: (props: { onClose: () => void }) => (
    <div role="dialog" aria-label="Backends stub">
      <button onClick={props.onClose}>close backends</button>
    </div>
  ),
}));

const mocked = vi.mocked(api);

function Where() {
  const location = useLocation();
  return <div data-testid="where">{location.pathname + location.search}</div>;
}

function renderLayout(options: Parameters<typeof renderPage>[1] = {}) {
  return renderPage(
    <Layout>
      <Where />
    </Layout>,
    options,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  setNavGuard(null);
  setDashboardTourRunner(null);
  document.documentElement.removeAttribute('data-theme');
  mocked.openaiIsConfigured.mockResolvedValue({ result: false });
  mocked.listEndpoints.mockResolvedValue([]);
  mocked.listFilesRecursively.mockResolvedValue([]);
  mocked.listTasks.mockResolvedValue([]);
  mocked.mlTypes.mockResolvedValue([]);
  for (const key of Object.keys(socket.handlers)) {
    delete socket.handlers[key];
  }
});

afterEach(() => {
  vi.useRealTimers();
});

describe('navigation', () => {
  it('lists every section with its label, the page as content, and the connection', () => {
    renderLayout();
    const nav = screen.getByRole('navigation');
    for (const section of SECTIONS) {
      expect(within(nav).getByRole('link', { name: section.label })).toHaveAttribute(
        'href',
        section.to,
      );
    }
    expect(screen.getByTestId('where')).toHaveTextContent('/');
    expect(screen.getByText('v1.2.3')).toBeInTheDocument();
    expect(screen.getByText('root')).toBeInTheDocument();
    expect(screen.getByText('cloudlet.test')).toBeInTheDocument();
  });

  it('marks only the current section active', () => {
    renderLayout({ route: '/databases' });
    expect(screen.getByRole('link', { name: 'Databases' })).toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveClass('active');
  });

  it('clicking a section navigates there', async () => {
    renderLayout();
    await userEvent.click(screen.getByRole('link', { name: 'Databases' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/databases');
  });

  it('the profile link goes to the user profile', async () => {
    renderLayout();
    await userEvent.click(screen.getByRole('link', { name: /root/ }));
    expect(screen.getByTestId('where')).toHaveTextContent('/user-profile');
  });
});

describe('sidebar collapse and phone drawer', () => {
  it('starts expanded, collapses on demand and remembers it', async () => {
    const view = renderLayout();
    const aside = view.container.querySelector('aside')!;
    expect(aside).not.toHaveClass('collapsed');
    await userEvent.click(screen.getByTitle('Hide navigation'));
    expect(aside).toHaveClass('collapsed');
    expect(localStorage.getItem('magic2.navCollapsed')).toBe('true');
    expect(screen.getByTitle('Show navigation')).toHaveStyle({ left: '0px' });
    await userEvent.click(screen.getByTitle('Show navigation'));
    expect(aside).not.toHaveClass('collapsed');
    expect(localStorage.getItem('magic2.navCollapsed')).toBe('false');
  });

  it('starts collapsed when it was left collapsed', () => {
    localStorage.setItem('magic2.navCollapsed', 'true');
    const view = renderLayout();
    expect(view.container.querySelector('aside')).toHaveClass('collapsed');
  });

  it('the hamburger opens the drawer, the backdrop and a nav click close it', async () => {
    const view = renderLayout();
    const shell = view.container.querySelector('.shell')!;
    await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    expect(shell).toHaveClass('nav-open');
    await userEvent.click(view.container.querySelector('.nav-backdrop')!);
    expect(shell).not.toHaveClass('nav-open');
    await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    await userEvent.click(screen.getByRole('link', { name: 'Databases' }));
    expect(shell).not.toHaveClass('nav-open');
  });

  it('opening something from the footer also closes the drawer', async () => {
    const view = renderLayout();
    const shell = view.container.querySelector('.shell')!;
    await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    await userEvent.click(screen.getByTitle('Keyboard shortcuts (Ctrl+/ / Cmd+/)'));
    expect(shell).not.toHaveClass('nav-open');
  });
});

describe('footer actions', () => {
  it('logout calls the auth logout', async () => {
    const { auth } = renderLayout();
    await userEvent.click(screen.getByTitle('Logout'));
    expect(auth.logout).toHaveBeenCalledTimes(1);
  });

  it('the theme button toggles and persists the theme', async () => {
    renderLayout();
    await userEvent.click(screen.getByTitle('Switch to dark mode'));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('magic2.theme')).toBe('dark');
    await userEvent.click(screen.getByTitle('Switch to light mode'));
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('the support button opens Frank', async () => {
    renderLayout();
    await userEvent.click(screen.getByTitle('Ask Frank about Hyperlambda and Magic'));
    expect(openSupport).toHaveBeenCalledTimes(1);
  });

  it('the cloudlet button opens the backends dialog and closing it removes it', async () => {
    renderLayout({
      auth: { backends: [TEST_BACKEND, { ...TEST_BACKEND, url: 'https://other.test' }] },
    });
    await userEvent.click(screen.getByTitle('Switch cloudlet — 2 signed in'));
    expect(screen.getByRole('dialog', { name: 'Backends stub' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'close backends' }));
    expect(screen.queryByRole('dialog', { name: 'Backends stub' })).not.toBeInTheDocument();
  });
});

describe('overlays and shortcuts', () => {
  it('Ctrl+K toggles the command palette', async () => {
    renderLayout();
    expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument();
    await userEvent.keyboard('{Control>}k{/Control}');
    expect(await screen.findByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();
    await userEvent.keyboard('{Control>}k{/Control}');
    expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument();
  });

  it('Cmd+K works too, and the footer search button opens the palette', async () => {
    renderLayout();
    await userEvent.keyboard('{Meta>}k{/Meta}');
    expect(await screen.findByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByTitle(/^Command palette/));
    expect(await screen.findByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();
  });

  it('Ctrl+/ toggles the shortcuts overview', async () => {
    renderLayout();
    await userEvent.keyboard('{Control>}/{/Control}');
    expect(await screen.findByRole('heading', { name: 'Keyboard shortcuts' })).toBeInTheDocument();
    await userEvent.keyboard('{Control>}/{/Control}');
    expect(screen.queryByRole('heading', { name: 'Keyboard shortcuts' })).not.toBeInTheDocument();
  });

  it('the footer keyboard button opens the shortcuts overview', async () => {
    renderLayout();
    await userEvent.click(screen.getByTitle('Keyboard shortcuts (Ctrl+/ / Cmd+/)'));
    expect(await screen.findByRole('heading', { name: 'Keyboard shortcuts' })).toBeInTheDocument();
  });

  it('plain keys do nothing', async () => {
    renderLayout();
    await userEvent.keyboard('k/.');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('pages can open the palette through the shell actions, and stop being able to once unmounted', async () => {
    const view = renderLayout();
    act(() => openPalette());
    expect(await screen.findByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();
    view.unmount();
    expect(() => openPalette()).not.toThrow();
    expect(() => openChatOps()).not.toThrow();
  });
});

describe('Chat Ops availability', () => {
  it('has no chat button, drawer or shortcut without an OpenAI key', async () => {
    renderLayout();
    await waitFor(() => expect(mocked.openaiIsConfigured).toHaveBeenCalled());
    expect(screen.queryByTitle(/^Chat Ops/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('chat')).not.toBeInTheDocument();
    await userEvent.keyboard('{Control>}.{/Control}');
    expect(screen.queryByTestId('chat')).not.toBeInTheDocument();
  });

  it('shows the chat once a key is added, without reloading the page', async () => {
    renderLayout();
    await waitFor(() => expect(mocked.openaiIsConfigured).toHaveBeenCalled());
    expect(screen.queryByTestId('chat')).not.toBeInTheDocument();

    mocked.openaiIsConfigured.mockResolvedValue({ result: true });
    act(() => refreshChat());
    expect(await screen.findByTestId('chat')).toBeInTheDocument();
    await userEvent.keyboard('{Control>}.{/Control}');
    expect(screen.getByTestId('chat')).toHaveAttribute('data-open', 'true');
  });

  it('stays hidden when the availability check fails', async () => {
    mocked.openaiIsConfigured.mockRejectedValue(new Error('403'));
    renderLayout();
    await waitFor(() => expect(mocked.openaiIsConfigured).toHaveBeenCalled());
    expect(screen.queryByTestId('chat')).not.toBeInTheDocument();
  });

  it('mounts the drawer closed for the signed-in user, and the button and Ctrl+. toggle it', async () => {
    mocked.openaiIsConfigured.mockResolvedValue({ result: true });
    renderLayout();
    const chat = await screen.findByTestId('chat');
    expect(chat).toHaveAttribute('data-open', 'false');
    expect(chat).toHaveAttribute('data-user', 'root');
    await userEvent.click(screen.getByTitle(/^Chat Ops/));
    expect(chat).toHaveAttribute('data-open', 'true');
    await userEvent.keyboard('{Control>}.{/Control}');
    expect(chat).toHaveAttribute('data-open', 'false');
    await userEvent.keyboard('{Control>}.{/Control}');
    expect(chat).toHaveAttribute('data-open', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'close chat' }));
    expect(chat).toHaveAttribute('data-open', 'false');
  });

  it('pages can open it through the shell actions', async () => {
    mocked.openaiIsConfigured.mockResolvedValue({ result: true });
    renderLayout();
    const chat = await screen.findByTestId('chat');
    act(() => openChatOps());
    expect(chat).toHaveAttribute('data-open', 'true');
  });
});

describe('palette actions', () => {
  async function openActions() {
    renderLayout();
    await userEvent.keyboard('{Control>}k{/Control}');
    await screen.findByRole('dialog', { name: 'Command palette' });
  }

  it('offers the layout actions, without chat and tour when they are unavailable', async () => {
    await openActions();
    for (const label of [
      'Toggle light/dark theme',
      'Switch cloudlet',
      'Ask Frank for help',
      'Create an API from your data',
      'Keyboard shortcuts',
    ]) {
      expect(screen.getByRole('option', { name: label })).toBeInTheDocument();
    }
    expect(
      screen.queryByRole('option', { name: 'Chat with your cloudlet' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Show the dashboard tour' }),
    ).not.toBeInTheDocument();
  });

  it('the theme action toggles the theme and closes the palette', async () => {
    await openActions();
    await userEvent.click(screen.getByRole('option', { name: 'Toggle light/dark theme' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument();
  });

  it('the cloudlet action opens the backends dialog', async () => {
    await openActions();
    await userEvent.click(screen.getByRole('option', { name: 'Switch cloudlet' }));
    expect(screen.getByRole('dialog', { name: 'Backends stub' })).toBeInTheDocument();
  });

  it('the help action opens Frank', async () => {
    await openActions();
    await userEvent.click(screen.getByRole('option', { name: 'Ask Frank for help' }));
    expect(openSupport).toHaveBeenCalledTimes(1);
  });

  it('the shortcuts action opens the overview', async () => {
    await openActions();
    await userEvent.click(screen.getByRole('option', { name: 'Keyboard shortcuts' }));
    expect(await screen.findByRole('heading', { name: 'Keyboard shortcuts' })).toBeInTheDocument();
  });

  it('the generator action navigates to the guided generator', async () => {
    await openActions();
    await userEvent.click(screen.getByRole('option', { name: 'Create an API from your data' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/generator?guided=1');
  });

  it('the dashboard tour action appears while the dashboard can run it, and runs it', async () => {
    const tour = vi.fn();
    setDashboardTourRunner(tour);
    await openActions();
    await userEvent.click(screen.getByRole('option', { name: 'Show the dashboard tour' }));
    expect(tour).toHaveBeenCalledTimes(1);
  });

  it('the chat action appears with an OpenAI key and opens the drawer', async () => {
    mocked.openaiIsConfigured.mockResolvedValue({ result: true });
    renderLayout();
    const chat = await screen.findByTestId('chat');
    await userEvent.keyboard('{Control>}k{/Control}');
    await userEvent.click(await screen.findByRole('option', { name: 'Chat with your cloudlet' }));
    expect(chat).toHaveAttribute('data-open', 'true');
  });

  it('picking a section from the palette navigates there', async () => {
    await openActions();
    await userEvent.type(screen.getByRole('combobox'), 'databases');
    await userEvent.keyboard('{Enter}');
    expect(screen.getByTestId('where')).toHaveTextContent('/databases');
  });
});

describe('navigation guard', () => {
  it('a guard that refuses keeps the user on the page, from the nav and from the palette', async () => {
    setNavGuard(() => Promise.resolve(false));
    renderLayout();
    await userEvent.click(screen.getByRole('link', { name: 'Databases' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/');
    expect(screen.getByTestId('where')).not.toHaveTextContent('/databases');
    await userEvent.keyboard('{Control>}k{/Control}');
    await userEvent.type(await screen.findByRole('combobox'), 'sql studio');
    await userEvent.keyboard('{Enter}');
    expect(screen.getByTestId('where')).not.toHaveTextContent('/sql-studio');
  });

  it('a guard that agrees lets the navigation through and is cleared', async () => {
    const guard = vi.fn(() => Promise.resolve(true));
    setNavGuard(guard);
    renderLayout();
    await userEvent.click(screen.getByRole('link', { name: 'Databases' }));
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/databases'));
    expect(guard).toHaveBeenCalledTimes(1);
    // The guard is gone, so the next click navigates without asking.
    await userEvent.click(screen.getByRole('link', { name: 'SQL Studio' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/sql-studio');
    expect(guard).toHaveBeenCalledTimes(1);
  });

  it('a guard that throws is logged and navigation is abandoned', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {
      // the expected failure should not clutter the test output
    });
    setNavGuard(() => Promise.reject(new Error('dialog broke')));
    renderLayout();
    await userEvent.click(screen.getByRole('link', { name: 'Databases' }));
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith('Navigation guard failed:', expect.any(Error)),
    );
    expect(screen.getByTestId('where')).not.toHaveTextContent('/databases');
    error.mockRestore();
  });
});

describe('toasts', () => {
  it('shows a toast raised from anywhere, and an error one as an alert', () => {
    renderLayout();
    act(() => showToast('Copied'));
    act(() => showToast('It broke', true));
    expect(screen.getByText('Copied')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('It broke');
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('dismisses a toast with its close button', async () => {
    renderLayout();
    act(() => showToast('Copied'));
    act(() => showToast('Other'));
    await userEvent.click(screen.getAllByTitle('Dismiss')[0]);
    expect(screen.queryByText('Copied')).not.toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
    await userEvent.click(screen.getByTitle('Dismiss'));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('removes a success toast after five seconds and an error after ten', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    renderLayout();
    act(() => showToast('ok'));
    act(() => showToast('bad', true));
    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(screen.getByText('ok')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByText('ok')).not.toBeInTheDocument();
    expect(screen.getByText('bad')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByText('bad')).not.toBeInTheDocument();
  });

  it('an error with a log id links to that entry and dismisses itself when followed', async () => {
    renderLayout();
    act(() => showToast('Failed', true, 42));
    await userEvent.click(screen.getByRole('link', { name: 'View log entry →' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/log?id=42');
    expect(screen.queryByText('Failed')).not.toBeInTheDocument();
  });

  it('stops listening for toasts once unmounted', () => {
    const view = renderLayout();
    view.unmount();
    expect(() => showToast('nobody is listening')).not.toThrow();
  });
});

describe('backend socket feed', () => {
  it('connects with reconnect and turns success and error messages into toasts', async () => {
    renderLayout();
    expect(socket.createSocket).toHaveBeenCalledWith({ reconnect: true });
    expect(socket.connection.on).toHaveBeenCalledWith(
      'magic.backend.message',
      expect.any(Function),
    );
    await waitFor(() => expect(socket.connection.start).toHaveBeenCalled());
    act(() =>
      socket.handlers['magic.backend.message'](
        JSON.stringify({ type: 'success', message: 'Plugin installed' }),
      ),
    );
    act(() =>
      socket.handlers['magic.backend.message'](
        JSON.stringify({ type: 'error', message: 'Training failed' }),
      ),
    );
    expect(screen.getByText('Plugin installed')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Training failed');
  });

  it('ignores messages of another type', () => {
    renderLayout();
    act(() =>
      socket.handlers['magic.backend.message'](
        JSON.stringify({ type: 'progress', message: 'half way' }),
      ),
    );
    expect(screen.queryByText('half way')).not.toBeInTheDocument();
  });

  it('does not connect when signed out', () => {
    renderLayout({ auth: { backend: { ...TEST_BACKEND, token: null } } });
    expect(socket.createSocket).not.toHaveBeenCalled();
  });

  it('survives a connection that fails to start and stops it on unmount', async () => {
    socket.connection.start.mockImplementationOnce(() => Promise.reject(new Error('refused')));
    const view = renderLayout();
    view.unmount();
    await waitFor(() => expect(socket.connection.stop).toHaveBeenCalledTimes(1));
  });

  it('reconnects when the backend changes', () => {
    const view = renderLayout();
    expect(socket.createSocket).toHaveBeenCalledTimes(1);
    view.unmount();
    renderLayout({
      auth: {
        backend: {
          url: 'https://second.test',
          username: 'bob',
          token: fakeToken({ unique_name: 'bob', role: ['root'] }),
        },
      },
    });
    expect(socket.createSocket).toHaveBeenCalledTimes(2);
  });
});
