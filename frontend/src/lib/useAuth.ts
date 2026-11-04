/*
 * The authentication context and the hook that reads it. Kept apart from
 * AuthProvider so that file exports only a component, as fast refresh wants.
 */

import { createContext, useContext } from 'react';

import type { StoredBackend } from './backend';

export interface AuthState {
  backend: StoredBackend | null;
  authenticated: boolean;
  /*
   * Whether the signed-in user can actually use the dashboard. Every
   * dashboard endpoint verifies root, so anyone else is authenticated but
   * unable to do anything — however they signed in.
   */
  isRoot: boolean;
  /*
   * Whether the backend still needs its first-run setup. Null until the
   * status has been fetched — the endpoint requires root, so this can only
   * be asked once signed in.
   */
  setupNeeded: boolean | null;
  // Called when setup completes, so the app stops showing the setup screen.
  setupCompleted: () => void;
  /*
   * The connected backend's Magic version. Owned here because two unrelated
   * places want it — the sidebar and the dashboard's KPI card — and asking
   * the backend once per interested component meant fetching the same
   * unchanging string twice on every dashboard visit.
   */
  version: string;
  login: (url: string, username: string, password: string) => Promise<void>;
  // Signs in with a ticket the backend already issued, as OpenID login does.
  loginWithTicket: (url: string, ticket: string) => void;
  logout: () => void;
  // Every backend signed into, so the user can move between cloudlets.
  backends: StoredBackend[];
  switchBackend: (url: string) => void;
  removeBackend: (url: string) => void;
  // Shows the login screen without disturbing the backends already stored.
  addBackend: () => void;
}

export const AuthContext = createContext<AuthState>(null!);

export function useAuth() {
  return useContext(AuthContext);
}
