// @vitest-environment jsdom
/*
 * Unit tests for the localStorage-backed half of the backend library: the
 * stored list of cloudlets, the active one, the upgrade paths from older
 * storage formats, the ?backend= link, and the OIDC hand-over.
 */

import { beforeEach, describe, expect, it } from 'vitest';

import {
  activateBackend,
  backendFromUrl,
  backendUrls,
  clearBackend,
  deactivateBackend,
  forgetBackend,
  httpUrl,
  loadBackend,
  loadBackends,
  rememberPendingOidc,
  saveBackend,
  servedByBackend,
  type StoredBackend,
  takePendingOidc,
  withoutTrailingSlashes,
} from '../backend';

const LIST = 'magic2.backends';
const ACTIVE = 'magic2.active-backend';

const a: StoredBackend = { url: 'https://a.test', username: 'root', token: 'ta' };
const b: StoredBackend = { url: 'https://b.test', username: 'bob', token: null };

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  globalThis.history.replaceState(null, '', '/');
});

describe('httpUrl', () => {
  it('passes http and https urls through', () => {
    expect(httpUrl('https://a.test/x')).toBe('https://a.test/x');
    expect(httpUrl('http://localhost:5000')).toBe('http://localhost:5000');
  });

  it('is empty for anything else', () => {
    expect(httpUrl('javascript:alert(1)')).toBe('');
    expect(httpUrl('data:text/html,x')).toBe('');
    expect(httpUrl('ftp://a.test')).toBe('');
    expect(httpUrl('a.test')).toBe('');
    expect(httpUrl('')).toBe('');
    expect(httpUrl(null)).toBe('');
    expect(httpUrl(undefined)).toBe('');
  });
});

describe('withoutTrailingSlashes', () => {
  it('strips any number of trailing slashes and nothing else', () => {
    expect(withoutTrailingSlashes('https://a.test///')).toBe('https://a.test');
    expect(withoutTrailingSlashes('https://a.test/x/')).toBe('https://a.test/x');
    expect(withoutTrailingSlashes('https://a.test')).toBe('https://a.test');
    expect(withoutTrailingSlashes('///')).toBe('');
    expect(withoutTrailingSlashes('')).toBe('');
  });

  it('is fast on a long run of slashes that is not at the end', () => {
    const value = '/'.repeat(100000) + 'x';
    expect(withoutTrailingSlashes(value)).toBe(value);
  });
});

describe('loadBackends', () => {
  it('is empty when nothing is stored anywhere', () => {
    expect(loadBackends()).toEqual([]);
    expect(loadBackend()).toBeNull();
  });

  it('reads the stored list', () => {
    localStorage.setItem(LIST, JSON.stringify([a, b]));
    expect(loadBackends()).toEqual([a, b]);
  });

  it('migrates the single legacy backend into the list and makes it active', () => {
    localStorage.setItem('magic2.backend', JSON.stringify(a));
    expect(loadBackends()).toEqual([a]);
    expect(JSON.parse(localStorage.getItem(LIST)!)).toEqual([a]);
    expect(localStorage.getItem(ACTIVE)).toBe(a.url);
    expect(localStorage.getItem('magic2.backend')).toBeNull();
  });

  it('prefers the list over a leftover legacy entry', () => {
    localStorage.setItem(LIST, JSON.stringify([b]));
    localStorage.setItem('magic2.backend', JSON.stringify(a));
    expect(loadBackends()).toEqual([b]);
  });
});

describe('importing from the previous dashboard', () => {
  const OLD = 'magic.backends';

  it('imports urls, usernames and tokens, drops passwords and trailing slashes', () => {
    localStorage.setItem(
      OLD,
      JSON.stringify([
        { url: 'https://a.test//', username: 'root', password: 'secret' },
        { url: 'https://b.test', username: 'bob', token: 'tb' },
      ]),
    );
    const list = loadBackends();
    expect(list).toEqual([
      { url: 'https://a.test', username: 'root', token: null },
      { url: 'https://b.test', username: 'bob', token: 'tb' },
    ]);
    expect(localStorage.getItem(LIST)).not.toContain('secret');
    // The one still signed in becomes active, and the old key is left in place.
    expect(localStorage.getItem(ACTIVE)).toBe('https://b.test');
    expect(localStorage.getItem(OLD)).not.toBeNull();
  });

  it('makes the first active when none is signed in', () => {
    localStorage.setItem(
      OLD,
      JSON.stringify([{ url: 'https://a.test' }, { url: 'https://b.test' }]),
    );
    expect(loadBackends()).toHaveLength(2);
    expect(localStorage.getItem(ACTIVE)).toBe('https://a.test');
  });

  it('defaults a missing username and ignores wrongly typed fields', () => {
    localStorage.setItem(OLD, JSON.stringify([{ url: 'https://a.test', username: 5, token: 7 }]));
    expect(loadBackends()).toEqual([{ url: 'https://a.test', username: '', token: null }]);
  });

  it('skips entries without a usable url', () => {
    localStorage.setItem(
      OLD,
      JSON.stringify([null, { url: '' }, { url: 42 }, 'x', { url: 'https://a.test' }]),
    );
    expect(loadBackends().map(backend => backend.url)).toEqual(['https://a.test']);
  });

  it('imports nothing from malformed or non-list data', () => {
    localStorage.setItem(OLD, '{not json');
    expect(loadBackends()).toEqual([]);
    localStorage.setItem(OLD, JSON.stringify({ url: 'https://a.test' }));
    expect(loadBackends()).toEqual([]);
    localStorage.setItem(OLD, JSON.stringify([{ url: '' }]));
    expect(loadBackends()).toEqual([]);
    expect(localStorage.getItem(LIST)).toBeNull();
  });
});

describe('saveBackend and loadBackend', () => {
  it('stores a backend first in the list and makes it active', () => {
    saveBackend(a);
    saveBackend(b);
    expect(loadBackends()).toEqual([b, a]);
    expect(loadBackend()).toEqual(b);
  });

  it('replaces a backend with the same url instead of duplicating it', () => {
    saveBackend(a);
    saveBackend({ ...a, token: 'new' });
    expect(loadBackends()).toEqual([{ ...a, token: 'new' }]);
  });

  it('falls back to the first when the active url is unknown or missing', () => {
    localStorage.setItem(LIST, JSON.stringify([a, b]));
    expect(loadBackend()).toEqual(a);
    localStorage.setItem(ACTIVE, 'https://gone.test');
    expect(loadBackend()).toEqual(a);
  });

  it('is null when deliberately deactivated, without touching the stored list', () => {
    saveBackend(a);
    deactivateBackend();
    expect(loadBackend()).toBeNull();
    expect(loadBackends()).toEqual([a]);
  });
});

describe('clearBackend', () => {
  it('signs the active backend out but keeps it in the list', () => {
    localStorage.setItem(LIST, JSON.stringify([a, { ...b, token: 'tb' }]));
    localStorage.setItem(ACTIVE, a.url);
    clearBackend();
    expect(loadBackends()).toEqual([
      { ...a, token: null },
      { ...b, token: 'tb' },
    ]);
  });

  it('does nothing when there is no active backend', () => {
    clearBackend();
    expect(localStorage.getItem(LIST)).toBeNull();
  });
});

describe('activateBackend', () => {
  it('switches to a known backend and returns it', () => {
    localStorage.setItem(LIST, JSON.stringify([a, b]));
    expect(activateBackend(b.url)).toEqual(b);
    expect(loadBackend()).toEqual(b);
  });

  it('returns null and changes nothing for an unknown url', () => {
    localStorage.setItem(LIST, JSON.stringify([a]));
    localStorage.setItem(ACTIVE, a.url);
    expect(activateBackend('https://nope.test')).toBeNull();
    expect(localStorage.getItem(ACTIVE)).toBe(a.url);
  });
});

describe('forgetBackend', () => {
  it('removes a backend that is not active and keeps the active one', () => {
    localStorage.setItem(LIST, JSON.stringify([a, b]));
    localStorage.setItem(ACTIVE, a.url);
    expect(forgetBackend(b.url)).toEqual(a);
    expect(loadBackends()).toEqual([a]);
    expect(localStorage.getItem(ACTIVE)).toBe(a.url);
  });

  it('falls back to a signed-in backend when the active one is forgotten', () => {
    const c: StoredBackend = { url: 'https://c.test', username: 'c', token: 'tc' };
    localStorage.setItem(LIST, JSON.stringify([a, b, c]));
    localStorage.setItem(ACTIVE, a.url);
    expect(forgetBackend(a.url)).toEqual(c);
    expect(localStorage.getItem(ACTIVE)).toBe(c.url);
  });

  it('falls back to the first when none of the rest is signed in', () => {
    localStorage.setItem(LIST, JSON.stringify([a, b]));
    localStorage.setItem(ACTIVE, a.url);
    expect(forgetBackend(a.url)).toEqual(b);
  });

  it('clears the active marker when the last backend goes', () => {
    saveBackend(a);
    expect(forgetBackend(a.url)).toBeNull();
    expect(localStorage.getItem(ACTIVE)).toBeNull();
    expect(loadBackends()).toEqual([]);
  });
});

describe('backendUrls', () => {
  it('lists the stored urls in order', () => {
    expect(backendUrls()).toEqual([]);
    localStorage.setItem(LIST, JSON.stringify([a, b]));
    expect(backendUrls()).toEqual([a.url, b.url]);
  });
});

describe('backendFromUrl', () => {
  function visit(query: string) {
    globalThis.history.replaceState(null, '', '/' + query);
  }

  it('is null without the parameter', () => {
    expect(backendFromUrl()).toBeNull();
    visit('?other=1');
    expect(backendFromUrl()).toBeNull();
  });

  it('ignores a value that is not an http(s) url', () => {
    visit('?backend=' + encodeURIComponent('javascript:alert(1)'));
    expect(backendFromUrl()).toBeNull();
    visit('?backend=not-a-url');
    expect(backendFromUrl()).toBeNull();
    visit('?backend=');
    expect(backendFromUrl()).toBeNull();
    expect(localStorage.getItem(LIST)).toBeNull();
  });

  it('reuses a stored cloudlet, keeping its token, and activates it', () => {
    localStorage.setItem(LIST, JSON.stringify([a, b]));
    localStorage.setItem(ACTIVE, a.url);
    visit('?backend=' + encodeURIComponent('https://b.test/'));
    expect(backendFromUrl()).toEqual(b);
    expect(loadBackend()).toEqual(b);
  });

  it('remembers a cloudlet it has not seen, signed out', () => {
    visit('?backend=' + encodeURIComponent('http://localhost:5000//'));
    const fresh = { url: 'http://localhost:5000', username: '', token: null };
    expect(backendFromUrl()).toEqual(fresh);
    expect(loadBackends()).toEqual([fresh]);
    expect(loadBackend()).toEqual(fresh);
  });
});

describe('pending OIDC', () => {
  it('hands the pending login back once and then forgets it', () => {
    const pending = { backendUrl: 'https://a.test', returnPath: '/designer' };
    rememberPendingOidc(pending);
    expect(takePendingOidc()).toEqual(pending);
    expect(takePendingOidc()).toBeNull();
  });

  it('is null when nothing was remembered', () => {
    expect(takePendingOidc()).toBeNull();
  });

  it('keeps it out of localStorage', () => {
    rememberPendingOidc({ backendUrl: 'https://a.test', returnPath: '/' });
    expect(localStorage).toHaveLength(0);
  });
});

describe('servedByBackend', () => {
  it('is false with no active backend', () => {
    expect(servedByBackend()).toBe(false);
  });

  it('is true when the active backend shares the dashboard origin', () => {
    saveBackend({ url: globalThis.location.origin + '/', username: '', token: null });
    expect(servedByBackend()).toBe(true);
  });

  it('is false for a different origin', () => {
    saveBackend({ url: 'https://elsewhere.test', username: '', token: null });
    expect(servedByBackend()).toBe(false);
  });
});
