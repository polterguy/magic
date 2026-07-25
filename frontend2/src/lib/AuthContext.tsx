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
  rememberBackendUrl,
  tokenExpiration,
  tokenExpired,
} from './backend';
import { authenticate, configureApi, refreshTicket } from './api';

interface AuthState {
  backend: StoredBackend | null;
  authenticated: boolean;
  /*
   * Whether the signed-in user can actually use the dashboard. Every
   * dashboard endpoint verifies root, so a user without root or admin is
   * authenticated but unable to do anything — however they signed in.
   */
  isAdmin: boolean;
  login: (url: string, username: string, password: string) => Promise<void>;
  // Signs in with a ticket the backend already issued, as OpenID login does.
  loginWithTicket: (url: string, username: string, ticket: string) => void;
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
    configureApi(stored?.url ?? '', stored?.token ?? null);
    return stored;
  });
  const refreshTimer = useRef<number | null>(null);

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

  const loginWithTicket = useCallback((url: string, username: string, ticket: string) => {
    url = url.replace(/\/+$/, '');
    rememberBackendUrl(url);
    applyBackend({ url, username, token: ticket });
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
      isAdmin: !!backend?.token && isAdminToken(backend.token),
      login,
      loginWithTicket,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
