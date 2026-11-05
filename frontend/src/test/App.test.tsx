// @vitest-environment jsdom
/*
 * The app's routing gates, in the order they apply: a magic link before anything, then login,
 * then the root-only check, then first-time setup, and only then the layout with its routes.
 * Every page is replaced by a stub, so what is asserted is which one the app chooses.
 */
import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../App';
import { AuthContext, type AuthState } from '../lib/useAuth';
import { fakeAuth, TEST_BACKEND } from './renderPage';

const mounts = vi.hoisted(() => ({ layout: 0 }));

function stub(name: string) {
  return { default: () => <div data-testid={name} /> };
}

vi.mock('../pages/Login', () => stub('login'));
vi.mock('../pages/NoAccess', () => stub('no-access'));
vi.mock('../pages/NotFound', () => stub('not-found'));
vi.mock('../pages/Setup', () => stub('setup'));
vi.mock('../pages/MagicLink', () => ({
  default: () => <div data-testid="magic-link" />,
  MAGIC_LINK_PATH: '/authentication/magic-link',
}));
vi.mock('../components/Layout', () => ({
  default: function LayoutStub({ children }: { children: React.ReactNode }) {
    useEffect(() => {
      mounts.layout++;
    }, []);
    return <div data-testid="layout">{children}</div>;
  },
}));
vi.mock('../pages/Dashboard', () => stub('dashboard'));
vi.mock('../pages/Playground', () => stub('playground'));
vi.mock('../pages/Files', () => stub('files'));
vi.mock('../pages/WebDesigner', () => stub('web-designer'));
vi.mock('../pages/Sql', () => stub('sql'));
vi.mock('../pages/Databases', () => stub('databases'));
vi.mock('../pages/Configuration', () => stub('configuration'));
vi.mock('../pages/Profile', () => stub('profile'));
vi.mock('../pages/MachineLearning', () => stub('machine-learning'));
vi.mock('../pages/Plugins', () => stub('plugins'));
vi.mock('../pages/Generator', () => stub('generator'));
vi.mock('../pages/Endpoints', () => stub('endpoints'));
vi.mock('../pages/Users', () => stub('users'));
vi.mock('../pages/Tasks', () => stub('tasks'));
vi.mock('../pages/Log', () => stub('log'));

beforeEach(() => {
  mounts.layout = 0;
});

function app(route: string, auth: Partial<AuthState> = {}) {
  return (
    <MemoryRouter initialEntries={[route]}>
      <AuthContext.Provider value={fakeAuth(auth)}>
        <App />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

// Runs first: the lazy imports are cached after their first load, and the fallback shows only then.
describe('App while loading', () => {
  it('shows a spinner while the code-split layout loads for the first time', () => {
    const { container } = render(app('/'));
    expect(container.querySelector('.spinner')).not.toBeNull();
  });
});

describe('App gates', () => {
  it('shows the login screen when nobody is signed in', () => {
    render(app('/', { authenticated: false }));
    expect(screen.getByTestId('login')).toBeInTheDocument();
    expect(screen.queryByTestId('layout')).not.toBeInTheDocument();
  });

  it('shows the magic link screen before every other gate, signed in or not', () => {
    const { unmount } = render(app('/authentication/magic-link', { authenticated: false }));
    expect(screen.getByTestId('magic-link')).toBeInTheDocument();
    unmount();
    render(app('/authentication/magic-link', { isRoot: false, setupNeeded: true }));
    expect(screen.getByTestId('magic-link')).toBeInTheDocument();
    expect(screen.queryByTestId('no-access')).not.toBeInTheDocument();
    expect(screen.queryByTestId('setup')).not.toBeInTheDocument();
  });

  it('keeps a signed-in user who is not root out of the layout', () => {
    render(app('/', { isRoot: false }));
    expect(screen.getByTestId('no-access')).toBeInTheDocument();
    expect(screen.queryByTestId('layout')).not.toBeInTheDocument();
  });

  it('asks a root user on a fresh backend to finish setup first', () => {
    render(app('/', { setupNeeded: true }));
    expect(screen.getByTestId('setup')).toBeInTheDocument();
    expect(screen.queryByTestId('layout')).not.toBeInTheDocument();
  });

  it('checks root before setup', () => {
    render(app('/', { isRoot: false, setupNeeded: true }));
    expect(screen.getByTestId('no-access')).toBeInTheDocument();
  });

  it('checks the login before everything but the magic link', () => {
    render(app('/', { authenticated: false, isRoot: false, setupNeeded: true }));
    expect(screen.getByTestId('login')).toBeInTheDocument();
  });
});

describe('App routes behind the gates', () => {
  const ROUTES: [string, string][] = [
    ['/', 'dashboard'],
    ['/hyperlambda-playground', 'playground'],
    ['/hyper-ide', 'files'],
    ['/web-designer', 'web-designer'],
    ['/sql-studio', 'sql'],
    ['/databases', 'databases'],
    ['/generator', 'generator'],
    ['/endpoints', 'endpoints'],
    ['/user-roles-management', 'users'],
    ['/task-manager', 'tasks'],
    ['/configuration', 'configuration'],
    ['/user-profile', 'profile'],
    ['/machine-learning', 'machine-learning'],
    ['/plugins', 'plugins'],
    ['/log', 'log'],
  ];

  it.each(ROUTES)('renders the page for %s inside the layout', async (route, page) => {
    render(app(route));
    expect(await screen.findByTestId(page)).toBeInTheDocument();
    expect(screen.getByTestId('layout')).toContainElement(screen.getByTestId(page));
    // Exactly that page, nothing else from the route table.
    expect(screen.queryByTestId('not-found')).not.toBeInTheDocument();
  });

  it('shows the not found page for an unknown address, still inside the layout', async () => {
    render(app('/nowhere'));
    expect(await screen.findByTestId('not-found')).toBeInTheDocument();
    expect(screen.getByTestId('layout')).toContainElement(screen.getByTestId('not-found'));
  });

  it('rebuilds the whole layout when the backend changes', async () => {
    const { rerender } = render(app('/'));
    await screen.findByTestId('dashboard');
    expect(mounts.layout).toBe(1);
    rerender(app('/'));
    expect(mounts.layout).toBe(1);
    rerender(
      app('/', {
        backend: { ...TEST_BACKEND, url: 'https://other.test' },
      }),
    );
    expect(mounts.layout).toBe(2);
  });
});
