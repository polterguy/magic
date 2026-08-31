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
  backendFromUrl,
  deactivateBackend,
  forgetBackend,
  loadBackend,
  loadBackends,
  saveBackend,
  clearBackend,
  isRootToken,
  tokenUsername,
  tokenExpiration,
  tokenExpired,
} from './backend';
import {
  authenticate,
  configureApi,
  getStatus,
  getVersion,
  refreshTicket,
  setUnauthorizedHandler,
  verifyTicket,
} from './api';
import { showToast } from './toast';

interface AuthState {
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

const AuthContext = createContext<AuthState>(null!);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {

  const [backend, setBackend] = useState<StoredBackend | null>(() => {
    /*
     * A "?backend=" link wins over whatever was last active, since it is an
     * explicit instruction to point at that cloudlet. Resolved here rather
     * than from an effect because the login screen initialises its field on
     * the first render - from an effect it would already have guessed the
     * domain the dashboard itself was served from, and keep it.
     */
    const stored = backendFromUrl() ?? loadBackend();
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
  const [version, setVersion] = useState('…');

  /*
   * Checked on every load that has a root token, not just after signing
   * in — the old dashboard only asked at login, so reloading with a stored
   * token skipped setup entirely.
   */
  const token = backend?.token ?? null;
  const isRoot = !!token && isRootToken(token);
  useEffect(() => {
    if (!isRoot) {
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
  }, [isRoot, token]);

  /*
   * The backend's version, fetched once per backend rather than once per
   * component that displays it. Keyed on the URL rather than the token,
   * since the answer belongs to the cloudlet, not to the session.
   *
   * Root only — the endpoint verifies root, and non-root sign-ins land on
   * the NoAccess screen, which deliberately calls nothing.
   */
  useEffect(() => {
    if (!token || !isRoot) {
      setVersion('…');
      return;
    }
    let cancelled = false;
    getVersion()
      .then(response => { if (!cancelled) { setVersion(response.version); } })
      .catch(() => { if (!cancelled) { setVersion('?'); } });
    return () => { cancelled = true; };
  }, [backend?.url, token, isRoot]);

  /*
   * When the backend answers 401 to a request that carried the token, the
   * session is dead — the secret rotated, or the token aged out. Dropping
   * the token here, once, sends the user to the login screen instead of
   * every page raining its own 401 toasts.
   */
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setBackend(current => {
        if (!current?.token) {
          return current;
        }
        const next = { ...current, token: null };
        configureApi(next.url, null);
        saveBackend(next);
        showToast('Your session is no longer valid — please sign in again', true);
        return next;
      });
    });
    return () => setUnauthorizedHandler(null);
  }, []);

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
   * The "?backend=" parameter is consumed during initialisation above, so all
   * that remains is taking it out of the address bar - a reload should not
   * repeat the switch, and the address should not keep advertising it.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('backend')) {
      return;
    }
    params.delete('backend');
    const query = params.toString();
    window.history.replaceState(
      null, '', window.location.pathname + (query ? '?' + query : ''));
  }, []);

  /*
   * A stored token that has not expired is still not necessarily good: the
   * backend rotates its signing secret during setup, and a token signed with
   * the previous one looks valid here while the server rejects everything.
   * Asking outright avoids walking into a dashboard that cannot load.
   *
   * Only an answer from the backend signs anybody out - an unreachable server
   * is not a reason to discard a working session.
   */
  useEffect(() => {
    if (!token) {
      return;
    }
    let cancelled = false;
    verifyTicket()
      .then(valid => {
        if (valid || cancelled) {
          return;
        }
        setBackend(current => {
          const next = current ? { ...current, token: null } : null;
          configureApi(next?.url ?? '', null);
          if (next) {
            saveBackend(next);
          }
          return next;
        });
      })
      .catch(() => {
        // Offline or unreachable, which says nothing about the token.
      });
    return () => { cancelled = true; };
  }, [token]);

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
    const refresh = async () => {
      try {
        const response = await refreshTicket();
        applyBackend({ ...backend, token: response.ticket });
      } catch {
        /*
         * Only an answer from the backend invalidates a session — a laptop
         * waking from sleep or a restarting server is a network hiccup, not
         * a verdict on the token. A definitive 401 already dropped the token
         * app-wide (the unauthorized handler above); anything else retries
         * while the token still works.
         */
        if (!tokenExpired(backend.token!)) {
          refreshTimer.current = window.setTimeout(refresh, 10000);
        }
      }
    };
    const millisecondsUntilRefresh = Math.max(0, (exp - 60) * 1000 - Date.now());
    refreshTimer.current = window.setTimeout(refresh, millisecondsUntilRefresh);
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
      isRoot,
      setupNeeded,
      setupCompleted: () => setSetupNeeded(false),
      version,
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
