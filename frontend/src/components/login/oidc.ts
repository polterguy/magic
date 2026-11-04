import { OidcProvider } from '../../lib/api';

/*
 * Where providers send the user back to. This has to match what's registered
 * for the client with the provider, character for character.
 */
export const OIDC_CALLBACK_PATH = '/authentication/oidc-callback';

/*
 * The provider returns its id_token in the URL fragment, since these are
 * "id_token" response-type providers. Reads it, then drops both the token and
 * the callback path from the address bar so a reload can't replay it.
 */
export function takeIdTokenFromUrl() {
  if (!globalThis.location.hash.includes('id_token=')) {
    return null;
  }
  const token = new URLSearchParams(globalThis.location.hash.slice(1)).get('id_token');
  // Strip the token from the address bar; the route is set below by the router.
  globalThis.history.replaceState(null, '', globalThis.location.pathname);
  return token;
}

/*
 * A provider that refuses the sign-in outright bounces back with
 * ?error=...&error_description=... instead of a code — surfaced rather than
 * silently dropped, or a refused redirect just looks like nothing happened.
 */
export function takeOidcErrorFromUrl() {
  const params = new URLSearchParams(globalThis.location.search);
  const error = params.get('error');
  if (!error) {
    return null;
  }
  const description = params.get('error_description');
  globalThis.history.replaceState(null, '', globalThis.location.pathname);
  return description ? error + ' — ' + description : error;
}

/*
 * Code-flow providers answer with ?code=...&state=... in the query string
 * instead. Reads both, then strips them from the address bar the same way.
 */
export function takeCodeFromUrl() {
  const params = new URLSearchParams(globalThis.location.search);
  const code = params.get('code');
  const state = params.get('state');
  if (!code || !state) {
    return null;
  }
  globalThis.history.replaceState(null, '', globalThis.location.pathname);
  return { code, state };
}

// A provider the backend has given both a sign-in URL and a client ID.
export function isConfiguredProvider(
  provider: OidcProvider,
): provider is OidcProvider & { url: string; client_id: string } {
  return !!provider.url && !!provider.client_id;
}

/*
 * The provider's sign-in URL, carrying the query its flow needs. redirectUri
 * is matched by the provider exactly against what's registered.
 */
export function oidcAuthorizeUrl(
  provider: OidcProvider & { url: string; client_id: string },
  redirectUri: string,
): string {
  const query = new URLSearchParams({
    client_id: provider.client_id,
    response_type: provider.response_type ?? 'id_token',
    scope: provider.scope ?? 'openid email profile',
    redirect_uri: redirectUri,
  });
  /*
   * Implicit providers bind the sign-in through a nonce, code providers
   * through their state + PKCE challenge — each redirect carries only what
   * its flow needs.
   */
  if (provider.nonce) {
    query.set('nonce', provider.nonce);
  }
  if (provider.state) {
    query.set('state', provider.state);
  }
  if (provider.code_challenge) {
    query.set('code_challenge', provider.code_challenge);
    query.set('code_challenge_method', 'S256');
  }
  return provider.url + '?' + query.toString();
}
