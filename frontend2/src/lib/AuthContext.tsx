/*
 * Authentication context. Owns the connected backend, logs in and out,
 * and keeps the JWT token refreshed before it expires.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import {
  StoredBackend,
  loadBackend,
  saveBackend,
  clearBackend,
  isAdminToken,
  tokenUsername,
  rememberBackendUrl,
  tokenExpiration,
  tokenExpired,
} from './backend';
import { authenticate, configureApi, getStatus, refreshTicket } from './api';

interface AuthState {
  backend: StoredBackend | null;
  authenticated: boolean;
  /*
   * Whether the signed-in user can actually use the dashboard. Every
   * dashboard endpoint verifies root, so a user without root or admin is
   * authenticated but unable to do anything — however they signed in.
   */
  isAdmin: boolean;
  /*
   * Whether the backend still needs its first-run setup. Null until the
   * status has been fetched — the endpoint requires root, so this can only
   * be asked once signed in.
   */
  setupNeeded: boolean | null;
  // Called when setup completes, so the app stops showing the setup screen.
  setupCompleted: () => void;
  login: (url: string, username: string, password: string) => Promise<void>;
  // Signs in with a ticket the backend already issued, as OpenID login does.
  loginWithTicket: (url: string, ticket: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState>(null!);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {

  const [backend, setBackend] = useState<StoredBackend | null>(() => {
    const stored = loadBackend();
    if (stored?.token && tokenExpired(stored.token)) {
      stored.token = null;
    }
    if (stored?.token && !stored.username) {
      stored.username = tokenUsername(stored.token);
    }
    configureApi(stored?.url ?? '', stored?.token ?? null);
    return stored;
  });
  const refreshTimer = useRef<number | null>(null);
  const [setupNeeded, setSetupNeeded] = useState<boolean | null>(null);

  /*
   * Checked on every load that has an admin token, not just after signing
   * in — the old dashboard only asked at login, so reloading with a stored
   * token skipped setup entirely.
   */
  const token = backend?.token ?? null;
  const isAdmin = !!token && isAdminToken(token);
  useEffect(() => {
    if (!isAdmin) {
      setSetupNeeded(null);
      return;
    }
    let cancelled = false;
    getStatus()
      .then(response => {
        if (!cancelled) {
          setSetupNeeded(!response.result);
        }
      })
      // An unreachable or older backend shouldn't trap anyone on setup.
      .catch(() => { if (!cancelled) { setSetupNeeded(false); } });
    return () => { cancelled = true; };
  }, [isAdmin, token]);

  const applyBackend = useCallback((value: StoredBackend | null) => {
    configureApi(value?.url ?? '', value?.token ?? null);
    if (value) {
      saveBackend(value);
    } else {
      clearBackend();
    }
    setBackend(value);
  }, []);

  // Refreshes the JWT token one minute before it expires.
  useEffect(() => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
    if (!backend?.token) {
      return;
    }
    const exp = tokenExpiration(backend.token);
    if (!exp) {
      return;
    }
    const millisecondsUntilRefresh = Math.max(0, (exp - 60) * 1000 - Date.now());
    refreshTimer.current = window.setTimeout(async () => {
      try {
        const response = await refreshTicket();
        applyBackend({ ...backend, token: response.ticket });
      } catch {
        applyBackend({ ...backend, token: null });
      }
    }, millisecondsUntilRefresh);
    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
    };
  }, [backend, applyBackend]);

  const login = useCallback(async (url: string, username: string, password: string) => {
    url = url.replace(/\/+$/, '');
    const response = await authenticate(url, username, password);
    rememberBackendUrl(url);
    applyBackend({ url, username, token: response.ticket });
  }, [applyBackend]);

  const loginWithTicket = useCallback((url: string, ticket: string) => {
    url = url.replace(/\/+$/, '');
    rememberBackendUrl(url);
    // Whoever the ticket belongs to — the caller has no better source.
    applyBackend({ url, username: tokenUsername(ticket), token: ticket });
  }, [applyBackend]);

  const logout = useCallback(() => {
    if (backend) {
      applyBackend({ ...backend, token: null });
    }
  }, [backend, applyBackend]);

  return (
    <AuthContext.Provider value={{
      backend,
      authenticated: !!backend?.token,
      isAdmin,
      setupNeeded,
      setupCompleted: () => setSetupNeeded(false),
      login,
      loginWithTicket,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
