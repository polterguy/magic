import { describe, expect, it } from 'vitest';

import { allowsDashboard, parseFrontendUrls, toBackendUrl, toOrigin } from '../urls';

describe('toOrigin', () => {
  it('reduces an http(s) URL to its origin', () => {
    expect(toOrigin('https://app.example.com/some/path?x=1')).toBe('https://app.example.com');
    expect(toOrigin(' http://localhost:4201/ ')).toBe('http://localhost:4201');
  });

  it('refuses anything that is not an http(s) URL', () => {
    expect(toOrigin('app.example.com')).toBeNull();
    expect(toOrigin('ftp://example.com')).toBeNull();
    expect(toOrigin('')).toBeNull();
  });
});

describe('toBackendUrl', () => {
  it('keeps the address as typed without trailing slashes', () => {
    expect(toBackendUrl('https://api.example.com//')).toBe('https://api.example.com');
    expect(toBackendUrl('https://example.com/magic')).toBe('https://example.com/magic');
  });

  it('refuses what is not an http(s) URL', () => {
    expect(toBackendUrl('api.example.com')).toBeNull();
  });
});

describe('parseFrontendUrls', () => {
  it('reads one per line or comma separated, as origins without repeats, in order', () => {
    expect(
      parseFrontendUrls(
        'https://a.test/\n\nhttps://b.test, https://A.test ,http://localhost:4201/x',
      ),
    ).toEqual({
      origins: ['https://a.test', 'https://b.test', 'http://localhost:4201'],
      invalid: [],
    });
  });

  it('returns the entries that are not URLs, as typed', () => {
    expect(parseFrontendUrls('https://a.test\nnot a url\nftp://b.test')).toEqual({
      origins: ['https://a.test'],
      invalid: ['not a url', 'ftp://b.test'],
    });
  });

  it('is empty for nothing', () => {
    expect(parseFrontendUrls(' \n ')).toEqual({ origins: [], invalid: [] });
  });
});

describe('allowsDashboard', () => {
  const dashboard = 'https://dashboard.test';

  it('allows the dashboard when it is listed, whatever the case', () => {
    expect(
      allowsDashboard(['https://other.test', 'https://DASHBOARD.test'], dashboard, false),
    ).toBe(true);
  });

  it('allows everything when there is no list, and a dashboard the backend serves itself', () => {
    expect(allowsDashboard([], dashboard, false)).toBe(true);
    expect(allowsDashboard(['https://other.test'], dashboard, true)).toBe(true);
  });

  it('refuses a list without the dashboard', () => {
    expect(allowsDashboard(['https://other.test'], dashboard, false)).toBe(false);
  });
});
