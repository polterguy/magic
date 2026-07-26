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
  activateBackend,
  deactivateBackend,
  forgetBackend,
  loadBackend,
  loadBackends,
  saveBackend,
  clearBackend,
  isAdminToken,
  tokenUsername,
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
  // Every backend signed into, so the user can move between cloudlets.
  backends: StoredBackend[];
  switchBackend: (url: string) => void;
  removeBackend: (url: string) => void;
  // Shows the login screen without disturbing the backends already stored.
  addBackend: () => void;
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
  const [backends, setBackends] = useState<StoredBackend[]>(loadBackends);
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
    setBackends(loadBackends());
  }, []);

  // Moves to another backend already signed into, token and all.
  const switchBackend = useCallback((url: string) => {
    const stored = activateBackend(url);
    if (!stored) {
      return;
    }
    // An expired token is no better than none — fall through to the login.
    const next = stored.token && tokenExpired(stored.token)
      ? { ...stored, token: null }
      : stored;
    configureApi(next.url, next.token);
    setBackend(next);
    setBackends(loadBackends());
  }, []);

  const removeBackend = useCallback((url: string) => {
    const next = forgetBackend(url);
    configureApi(next?.url ?? '', next?.token ?? null);
    setBackend(next);
    setBackends(loadBackends());
  }, []);

  const addBackend = useCallback(() => {
    deactivateBackend();
    configureApi('', null);
    setBackend(null);
  }, []);

  /*
   * A "?backend=<url>" link points the dashboard at a particular cloudlet.
   * When that backend is already signed in, its token is reused and the
   * switch is silent; otherwise it becomes the active one and the login
   * screen opens against it. Either way the parameter is stripped, so a
   * reload doesn't repeat the switch.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = params.get('backend');
    if (!target) {
      return;
    }
    params.delete('backend');
    const query = params.toString();
    window.history.replaceState(
      null, '', window.location.pathname + (query ? '?' + query : ''));
    const url = target.replace(/\/+$/, '');
    if (loadBackends().some(candidate => candidate.url === url)) {
      switchBackend(url);
    } else {
      applyBackend({ url, username: '', token: null });
    }
  }, [switchBackend, applyBackend]);

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
    applyBackend({ url, username, token: response.ticket });
  }, [applyBackend]);

  const loginWithTicket = useCallback((url: string, ticket: string) => {
    url = url.replace(/\/+$/, '');
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
      backends,
      switchBackend,
      removeBackend,
      addBackend,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
