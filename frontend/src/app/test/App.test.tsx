// @vitest-environment jsdom
/*
 * The app's routing gates, in the order they apply: a magic link before anything, then login,
 * then the root-only check, then first-time setup, and only then the layout with its routes.
 * Every page is replaced by a stub, so what is asserted is which one the app chooses.
 */
import { AuthContext, type AuthState } from '@core/useAuth';
import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fakeAuth, TEST_BACKEND } from '../../test/renderPage';
import App from '../App';

const mounts = vi.hoisted(() => ({ layout: 0 }));

function stub(name: string) {
  return { default: () => <div data-testid={name} /> };
}

vi.mock('../auth/Login', () => stub('login'));
vi.mock('../auth/NoAccess', () => stub('no-access'));
vi.mock('../NotFound', () => stub('not-found'));
vi.mock('../auth/Setup', () => stub('setup'));
vi.mock('../auth/MagicLink', () => ({
  default: () => <div data-testid="magic-link" />,
  MAGIC_LINK_PATH: '/authentication/magic-link',
}));
vi.mock('../Layout', () => ({
  default: function LayoutStub({ children }: { children: React.ReactNode }) {
    useEffect(() => {
      mounts.layout++;
    }, []);
    return <div data-testid="layout">{children}</div>;
  },
}));
vi.mock('@features/dashboard/Dashboard', () => stub('dashboard'));
vi.mock('@features/playground/Playground', () => stub('playground'));
vi.mock('@features/files/Files', () => stub('files'));
vi.mock('@features/designer/WebDesigner', () => stub('web-designer'));
vi.mock('@features/sql/Sql', () => stub('sql'));
vi.mock('@features/databases/Databases', () => stub('databases'));
vi.mock('@features/configuration/Configuration', () => stub('configuration'));
vi.mock('@features/profile/Profile', () => stub('profile'));
vi.mock('@features/ml/MachineLearning', () => stub('machine-learning'));
vi.mock('@features/plugins/Plugins', () => stub('plugins'));
vi.mock('@features/generator/Generator', () => stub('generator'));
vi.mock('@features/endpoints/Endpoints', () => stub('endpoints'));
vi.mock('@features/users/Users', () => stub('users'));
vi.mock('@features/tasks/Tasks', () => stub('tasks'));
vi.mock('@features/log/Log', () => stub('log'));

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
