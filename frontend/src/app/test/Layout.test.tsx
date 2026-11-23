// @vitest-environment jsdom
/*
 * The application shell: navigation, collapse and phone drawer, theme, the Ctrl/Cmd shortcuts and
 * the overlays they open, what features add to it, guard-aware navigation, the toast stack and
 * the socket feed behind it.
 *
 * It runs against stand-in features registered here rather than the real ones, so the shell is
 * tested alone — and so is what it does when a feature it links to is not in the build.
 */
import { setNavGuard } from '@shared/lib/navGuard';
import { openSupport } from '@shared/lib/support';
import { showToast } from '@shared/lib/toast';
import { type FeatureManifest, features, registerFeatures } from '@shared/shell/features';
import {
  addFooterAction,
  addPaletteAction,
  openChatOps,
  openPalette,
} from '@shared/shell/shellActions';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { fakeToken, renderPage, TEST_BACKEND } from '../../test/renderPage';
import Layout from '../components/Layout';

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

vi.mock('@shared/api/socket', () => ({ createSocket: socket.createSocket }));
vi.mock('@shared/lib/support', () => ({ openSupport: vi.fn(() => Promise.resolve()) }));
vi.mock('../components/BackendsDialog', () => ({
  default: (props: { onClose: () => void }) => (
    <div role="dialog" aria-label="Backends stub">
      <button onClick={props.onClose}>close backends</button>
    </div>
  ),
}));

const Icon = () => <svg />;

// A feature with no page that adds a footer button and a palette action while it is mounted.
const widget = vi.hoisted(() => ({ clicked: vi.fn(), ran: vi.fn() }));
function WidgetShell() {
  useEffect(() => {
    const removeFooter = addFooterAction({
      id: 'widget',
      title: 'Widget button',
      Icon,
      onClick: widget.clicked,
    });
    const removeAction = addPaletteAction({ label: 'Run the widget', action: widget.ran });
    return () => {
      removeFooter();
      removeAction();
    };
  }, []);
  return <div data-testid="widget-shell" />;
}

const FEATURES: FeatureManifest[] = [
  { id: 'dashboard', path: '/', nav: { label: 'Dashboard', Icon, order: 0 } },
  {
    id: 'databases',
    path: '/databases',
    nav: { label: 'Databases', Icon, order: 10 },
    roomy: true,
  },
  { id: 'sql', path: '/sql-studio', nav: { label: 'SQL Studio', Icon, order: 20 } },
  {
    id: 'generator',
    path: '/generator',
    nav: { label: 'Endpoint Generator', Icon, order: 30 },
    palette: { links: [{ label: 'Create an API from your data', to: '?guided=1' }] },
  },
  { id: 'profile', path: '/user-profile', nav: { label: 'Profile', Icon, order: 40 } },
  { id: 'log', path: '/log', nav: { label: 'Log', Icon, order: 50 } },
  { id: 'widget', shell: WidgetShell },
];
const NAVIGABLE = FEATURES.filter(feature => feature.nav);

let realFeatures: readonly FeatureManifest[] = [];
beforeAll(() => {
  realFeatures = features();
});
afterAll(() => registerFeatures([...realFeatures]));

// The build without the given features, for as long as the test runs.
function withoutFeatures(...ids: string[]) {
  registerFeatures(FEATURES.filter(feature => !ids.includes(feature.id)));
}

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
  registerFeatures(FEATURES);
  document.documentElement.removeAttribute('data-theme');
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
    for (const feature of NAVIGABLE) {
      expect(within(nav).getByRole('link', { name: feature.nav!.label })).toHaveAttribute(
        'href',
        feature.path,
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

  it('shows the connection without a link when there is no profile feature', () => {
    withoutFeatures('profile');
    renderLayout();
    expect(screen.getByText('cloudlet.test')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /root/ })).not.toBeInTheDocument();
  });

  it('leaves a missing feature out of the navigation', () => {
    withoutFeatures('databases');
    renderLayout();
    expect(screen.queryByRole('link', { name: 'Databases' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'SQL Studio' })).toBeInTheDocument();
  });

  it('narrows the content for pages whose manifest asks for it', () => {
    const view = renderLayout({ route: '/databases' });
    expect(view.container.querySelector('main')).toHaveClass('content-roomy');
    view.unmount();
    const workspace = renderLayout({ route: '/sql-studio' });
    expect(workspace.container.querySelector('main')).not.toHaveClass('content-roomy');
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

describe('feature contributions', () => {
  it('mounts the shell of every feature that has one', async () => {
    renderLayout();
    expect(await screen.findByTestId('widget-shell')).toBeInTheDocument();
  });

  it('renders the footer buttons features add, which also close the phone drawer', async () => {
    const view = renderLayout();
    const shell = view.container.querySelector('.shell')!;
    await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    await userEvent.click(await screen.findByTitle('Widget button'));
    expect(widget.clicked).toHaveBeenCalledTimes(1);
    expect(shell).not.toHaveClass('nav-open');
  });

  it('drops what a feature added once it is gone', async () => {
    const view = renderLayout();
    await screen.findByTitle('Widget button');
    view.unmount();
    withoutFeatures('widget');
    renderLayout();
    expect(screen.queryByTitle('Widget button')).not.toBeInTheDocument();
  });
});

describe('palette actions', () => {
  async function openActions() {
    renderLayout();
    await userEvent.keyboard('{Control>}k{/Control}');
    await screen.findByRole('dialog', { name: 'Command palette' });
  }

  it('offers the layout actions and the feature links', async () => {
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
  });

  it('offers no generator link without the generator', async () => {
    withoutFeatures('generator');
    await openActions();
    expect(
      screen.queryByRole('option', { name: 'Create an API from your data' }),
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

  it('offers the actions features add while they are mounted, and runs them', async () => {
    await openActions();
    await userEvent.click(await screen.findByRole('option', { name: 'Run the widget' }));
    expect(widget.ran).toHaveBeenCalledTimes(1);
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

  it('an error with a log id has no link without the log feature', () => {
    withoutFeatures('log');
    renderLayout();
    act(() => showToast('Failed', true, 42));
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'View log entry →' })).not.toBeInTheDocument();
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
