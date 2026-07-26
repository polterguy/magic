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

/*
 * Several cloudlets can be signed into at once, each with its own token —
 * one of them is active at any time, and that's the one every request goes
 * to. The list survives switching, so moving between them doesn't mean
 * signing in again.
 */
const BACKENDS_KEY = 'magic2.backends';
const ACTIVE_KEY = 'magic2.active-backend';

// Where a single backend used to live, before several were supported.
const LEGACY_KEY = 'magic2.backend';

export function loadBackends(): StoredBackend[] {
  const raw = localStorage.getItem(BACKENDS_KEY);
  if (raw) {
    return JSON.parse(raw);
  }
  // First run after the upgrade — carry the one backend across.
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (!legacy) {
    return [];
  }
  const backend: StoredBackend = JSON.parse(legacy);
  localStorage.setItem(BACKENDS_KEY, JSON.stringify([backend]));
  localStorage.setItem(ACTIVE_KEY, backend.url);
  localStorage.removeItem(LEGACY_KEY);
  return [backend];
}

function persist(list: StoredBackend[]) {
  localStorage.setItem(BACKENDS_KEY, JSON.stringify(list));
}

// The backend every request currently goes to.
export function loadBackend(): StoredBackend | null {
  const list = loadBackends();
  const active = localStorage.getItem(ACTIVE_KEY);
  /*
   * An empty string means "none deliberately", which is how adding another
   * backend gets to the login screen without disturbing the stored ones. A
   * missing key is different — it just predates this and falls back.
   */
  if (active === '') {
    return null;
  }
  return list.find(candidate => candidate.url === active) ?? list[0] ?? null;
}

// Stores a backend and makes it the active one.
export function saveBackend(backend: StoredBackend) {
  const list = loadBackends().filter(candidate => candidate.url !== backend.url);
  persist([backend, ...list]);
  localStorage.setItem(ACTIVE_KEY, backend.url);
}

/*
 * Signing out clears the active backend's token but keeps the backend, so
 * it stays in the list to sign back into.
 */
export function clearBackend() {
  const active = loadBackend();
  if (!active) {
    return;
  }
  persist(loadBackends().map(candidate =>
    candidate.url === active.url ? { ...candidate, token: null } : candidate));
}

// Switches to another backend already in the list.
export function activateBackend(url: string): StoredBackend | null {
  const match = loadBackends().find(candidate => candidate.url === url);
  if (match) {
    localStorage.setItem(ACTIVE_KEY, url);
  }
  return match ?? null;
}

/*
 * Forgets a backend entirely. Removing the active one falls back to whatever
 * else is signed in, so the app doesn't end up pointing at nothing while
 * other backends are still available.
 */
export function forgetBackend(url: string): StoredBackend | null {
  const list = loadBackends().filter(candidate => candidate.url !== url);
  persist(list);
  if (localStorage.getItem(ACTIVE_KEY) === url) {
    const next = list.find(candidate => !!candidate.token) ?? list[0] ?? null;
    if (next) {
      localStorage.setItem(ACTIVE_KEY, next.url);
    } else {
      localStorage.removeItem(ACTIVE_KEY);
    }
    return next;
  }
  return loadBackend();
}

/*
 * Signals that the user wants to add another backend — the app shows the
 * login screen without touching any of the stored ones.
 */
export function deactivateBackend() {
  localStorage.setItem(ACTIVE_KEY, '');
}

/*
 * Backend URLs for the login screen's autocomplete, most recent first.
 * Only URLs are suggested — usernames and passwords are left to the
 * browser's own credential manager.
 */
export function backendUrls(): string[] {
  return loadBackends().map(backend => backend.url);
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

// The user a token belongs to, from its [unique_name] claim.
export function tokenUsername(token: string): string {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return '';
  }
  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  return typeof payload.unique_name === 'string' ? payload.unique_name : '';
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
