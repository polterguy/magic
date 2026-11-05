/*
 * Shared render helper for page tests: mounts a page inside the providers the real app gives it
 * (router, auth context, dialogs) and stubs the browser APIs jsdom lacks. Stubs live here, never
 * in production code.
 */
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { DialogProvider } from '../components/Dialogs';
import type { StoredBackend } from '../lib/backend';
import { AuthContext, type AuthState } from '../lib/useAuth';

class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

function installBrowserStubs() {
  if (!('window' in globalThis)) {
    return;
  }
  globalThis.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof globalThis.matchMedia;
  globalThis.ResizeObserver ??= NoopObserver as unknown as typeof ResizeObserver;
  globalThis.IntersectionObserver ??= NoopObserver as unknown as typeof IntersectionObserver;
  if (!('scrollIntoView' in Element.prototype)) {
    Object.defineProperty(Element.prototype, 'scrollIntoView', { value: () => {} });
  }
}

installBrowserStubs();

// An unsigned JWT carrying the given claims, which is all the dashboard ever reads from one.
export function fakeToken(claims: Record<string, unknown>) {
  return `h.${btoa(JSON.stringify(claims))}.s`;
}

export const TEST_BACKEND: StoredBackend = {
  url: 'https://cloudlet.test',
  token: fakeToken({ unique_name: 'root', role: ['root'] }),
  username: 'root',
};

// A signed-in root user; every callback is a spy the test can assert on.
export function fakeAuth(overrides: Partial<AuthState> = {}): AuthState {
  return {
    backend: TEST_BACKEND,
    authenticated: true,
    isRoot: true,
    setupNeeded: false,
    setupCompleted: vi.fn(),
    version: 'v1.2.3',
    login: vi.fn().mockResolvedValue(undefined),
    loginWithTicket: vi.fn(),
    logout: vi.fn(),
    backends: [TEST_BACKEND],
    switchBackend: vi.fn(),
    removeBackend: vi.fn(),
    addBackend: vi.fn(),
    ...overrides,
  };
}

export interface RenderPageOptions {
  // Initial URL, query string included.
  route?: string;
  auth?: Partial<AuthState>;
}

export function renderPage(ui: ReactElement, options: RenderPageOptions = {}) {
  const auth = fakeAuth(options.auth);
  const result = render(
    <MemoryRouter initialEntries={[options.route ?? '/']}>
      <AuthContext.Provider value={auth}>
        <DialogProvider>{ui}</DialogProvider>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
  return { ...result, auth };
}
