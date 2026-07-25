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
