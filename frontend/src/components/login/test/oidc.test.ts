/*
 * Unit tests for the login screen's OpenID helpers — reading what a provider
 * sent back from the URL, and building the URL that sends the user to it.
 *
 * Node environment: location and history are stubbed as globals
 * the helpers touch.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  isConfiguredProvider,
  OIDC_CALLBACK_PATH,
  oidcAuthorizeUrl,
  takeCodeFromUrl,
  takeIdTokenFromUrl,
  takeOidcErrorFromUrl,
} from '../oidc';

function stubLocation(location: { pathname?: string; search?: string; hash?: string }) {
  const replaceState = vi.fn();
  vi.stubGlobal('location', { pathname: '/', search: '', hash: '', ...location });
  vi.stubGlobal('history', { replaceState });
  return replaceState;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('OIDC_CALLBACK_PATH', () => {
  it('matches what the configuration page shows to register', () => {
    expect(OIDC_CALLBACK_PATH).toBe('/authentication/oidc-callback');
  });
});

describe('takeIdTokenFromUrl', () => {
  it('reads the id_token from the fragment and strips the address bar', () => {
    const replaceState = stubLocation({
      pathname: OIDC_CALLBACK_PATH,
      hash: '#id_token=abc.def.ghi&state=x',
    });
    expect(takeIdTokenFromUrl()).toBe('abc.def.ghi');
    expect(replaceState).toHaveBeenCalledWith(null, '', OIDC_CALLBACK_PATH);
  });

  it('returns null and leaves the URL alone without an id_token', () => {
    const replaceState = stubLocation({ hash: '#access_token=x' });
    expect(takeIdTokenFromUrl()).toBeNull();
    expect(replaceState).not.toHaveBeenCalled();
  });

  it('strips the URL even when the token is empty', () => {
    const replaceState = stubLocation({ hash: '#id_token=' });
    expect(takeIdTokenFromUrl()).toBe('');
    expect(replaceState).toHaveBeenCalledTimes(1);
  });
});

describe('takeOidcErrorFromUrl', () => {
  it('combines error and description, and strips the URL', () => {
    const replaceState = stubLocation({
      pathname: '/x',
      search: '?error=access_denied&error_description=User+said+no',
    });
    expect(takeOidcErrorFromUrl()).toBe('access_denied — User said no');
    expect(replaceState).toHaveBeenCalledWith(null, '', '/x');
  });

  it('returns the bare error without a description', () => {
    stubLocation({ search: '?error=server_error' });
    expect(takeOidcErrorFromUrl()).toBe('server_error');
  });

  it('returns null and leaves the URL alone without an error', () => {
    const replaceState = stubLocation({ search: '?code=1&state=2' });
    expect(takeOidcErrorFromUrl()).toBeNull();
    expect(replaceState).not.toHaveBeenCalled();
  });
});

describe('takeCodeFromUrl', () => {
  it('reads code and state, and strips the URL', () => {
    const replaceState = stubLocation({ pathname: '/p', search: '?code=c1&state=s1' });
    expect(takeCodeFromUrl()).toEqual({ code: 'c1', state: 's1' });
    expect(replaceState).toHaveBeenCalledWith(null, '', '/p');
  });

  it('needs both code and state', () => {
    const replaceState = stubLocation({ search: '?code=c1' });
    expect(takeCodeFromUrl()).toBeNull();
    stubLocation({ search: '?state=s1' });
    expect(takeCodeFromUrl()).toBeNull();
    expect(replaceState).not.toHaveBeenCalled();
  });
});

describe('isConfiguredProvider', () => {
  it('needs both a URL and a client ID', () => {
    expect(isConfiguredProvider({ name: 'G', issuer: 'i', url: 'u', client_id: 'c' })).toBe(true);
    expect(isConfiguredProvider({ name: 'G', issuer: 'i', url: 'u' })).toBe(false);
    expect(isConfiguredProvider({ name: 'G', issuer: 'i', client_id: 'c' })).toBe(false);
    expect(isConfiguredProvider({ name: 'G', issuer: 'i', url: '', client_id: 'c' })).toBe(false);
  });
});

describe('oidcAuthorizeUrl', () => {
  const redirect = 'https://dash.example.com' + OIDC_CALLBACK_PATH;

  it('defaults to the implicit id_token flow with the standard scopes', () => {
    const url = new URL(
      oidcAuthorizeUrl(
        { name: 'Google', issuer: 'g', url: 'https://accounts.example.com/auth', client_id: 'cid' },
        redirect,
      ),
    );
    expect(url.origin + url.pathname).toBe('https://accounts.example.com/auth');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: 'cid',
      response_type: 'id_token',
      scope: 'openid email profile',
      redirect_uri: redirect,
    });
  });

  it('adds the nonce for implicit providers', () => {
    const url = oidcAuthorizeUrl(
      { name: 'G', issuer: 'g', url: 'https://a/auth', client_id: 'c', nonce: 'n1' },
      redirect,
    );
    expect(new URL(url).searchParams.get('nonce')).toBe('n1');
    expect(new URL(url).searchParams.has('state')).toBe(false);
    expect(new URL(url).searchParams.has('code_challenge')).toBe(false);
  });

  it('adds state and the S256 PKCE challenge for code providers, in order', () => {
    const url = oidcAuthorizeUrl(
      {
        name: 'GitHub',
        issuer: 'gh',
        url: 'https://a/authorize',
        client_id: 'c',
        response_type: 'code',
        scope: 'read:user',
        state: 's1',
        code_challenge: 'ch',
      },
      redirect,
    );
    expect(url).toBe(
      'https://a/authorize?client_id=c&response_type=code&scope=read%3Auser&redirect_uri=' +
        encodeURIComponent(redirect) +
        '&state=s1&code_challenge=ch&code_challenge_method=S256',
    );
  });

  it('continues a query the provider URL already has', () => {
    const url = oidcAuthorizeUrl(
      { name: 'G', issuer: 'g', url: 'https://a/auth?tenant=x', client_id: 'c' },
      redirect,
    );
    expect(url.startsWith('https://a/auth?tenant=x&client_id=c')).toBe(true);
  });

  it('adds no separator when the provider URL already ends with one', () => {
    for (const base of ['https://a/auth?', 'https://a/auth?tenant=x&']) {
      const url = oidcAuthorizeUrl({ name: 'G', issuer: 'g', url: base, client_id: 'c' }, redirect);
      expect(url.startsWith(base + 'client_id=c')).toBe(true);
    }
  });
});
