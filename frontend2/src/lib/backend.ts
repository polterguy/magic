/*
 * Backend storage and JWT token handling.
 * Persists the connected backend in localStorage, and knows how to
 * parse JWT tokens to figure out when they expire.
 */

export interface StoredBackend {
  url: string;
  username: string;
  token: string | null;
}

const STORAGE_KEY = 'magic2.backend';

export function loadBackend(): StoredBackend | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  return JSON.parse(raw);
}

export function saveBackend(backend: StoredBackend) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(backend));
}

export function clearBackend() {
  localStorage.removeItem(STORAGE_KEY);
}

/*
 * List of all backend URLs the user has successfully signed in to,
 * most recently used first. Only URLs are persisted — usernames and
 * passwords are left to the browser's own credential manager.
 */
const URLS_KEY = 'magic2.backend-urls';

export function backendUrls(): string[] {
  const raw = localStorage.getItem(URLS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function rememberBackendUrl(url: string) {
  const urls = [url, ...backendUrls().filter(candidate => candidate !== url)];
  localStorage.setItem(URLS_KEY, JSON.stringify(urls));
}

/*
 * An OpenID redirect leaves the app entirely and comes back to a freshly
 * loaded page, so both the backend being signed into and the page the user
 * was trying to reach have to survive the trip. Signing in with a password
 * needs neither — that never leaves the route.
 *
 * sessionStorage rather than a cookie: only the browser ever needs this, and
 * a cookie would be sent to the server on every request for nothing. It's
 * also per-tab and dies with the tab, which suits a half-finished login —
 * localStorage would leave it lying around indefinitely.
 */
const PENDING_OIDC_KEY = 'magic2.oidc-pending';

export interface PendingOidc {
  backendUrl: string;
  returnPath: string;
}

export function rememberPendingOidc(pending: PendingOidc) {
  sessionStorage.setItem(PENDING_OIDC_KEY, JSON.stringify(pending));
}

// Read once and clear, so an abandoned attempt can't be picked up later.
export function takePendingOidc(): PendingOidc | null {
  const raw = sessionStorage.getItem(PENDING_OIDC_KEY);
  sessionStorage.removeItem(PENDING_OIDC_KEY);
  return raw ? JSON.parse(raw) : null;
}

/*
 * Returns the exp claim of a JWT token as a UNIX timestamp in seconds,
 * or null if the token can't be parsed.
 */
export function tokenExpiration(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  return typeof payload.exp === 'number' ? payload.exp : null;
}

export function tokenExpired(token: string): boolean {
  const exp = tokenExpiration(token);
  return exp !== null && exp * 1000 < Date.now();
}

/*
 * Roles from the token's [role] claim. The claim is a bare string when the
 * user has one role and an array when they have several, so both shapes have
 * to be handled.
 */
export function tokenRoles(token: string): string[] {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return [];
  }
  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  const role = payload.role;
  if (Array.isArray(role)) {
    return role;
  }
  return typeof role === 'string' ? [role] : [];
}

/*
 * Whether a token can actually use the dashboard. Every dashboard endpoint
 * verifies root, so anything less is signed in but unable to do anything —
 * regardless of how the user signed in.
 */
export function isAdminToken(token: string): boolean {
  const roles = tokenRoles(token);
  return roles.includes('root') || roles.includes('admin');
}
