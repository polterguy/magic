import Banner from '../components/Banner';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronIcon } from '../components/Icons';
import { useAuth } from '../lib/AuthContext';
import { useDebounced } from '../lib/usePagedList';
import {
  backendUrls,
  rememberPendingOidc,
  takePendingOidc,
} from '../lib/backend';
import {
  OidcProvider,
  canResetPassword,
  openidLogin,
  openidProviders,
  sendResetPasswordLink,
} from '../lib/api';

/*
 * Where providers send the user back to. This has to match what's registered
 * for the client with the provider, character for character.
 */
const OIDC_CALLBACK_PATH = '/authentication/oidc-callback';

/*
 * The provider returns its id_token in the URL fragment, since these are
 * "id_token" response-type providers. Reads it, then drops both the token and
 * the callback path from the address bar so a reload can't replay it.
 */
function takeIdTokenFromUrl() {
  if (!window.location.hash.includes('id_token=')) {
    return null;
  }
  const token = new URLSearchParams(window.location.hash.substring(1)).get('id_token');
  // Strip the token from the address bar; the route is set below by the router.
  window.history.replaceState(null, '', window.location.pathname);
  return token;
}

export default function Login() {

  const { backend, login, loginWithTicket } = useAuth();
  const navigate = useNavigate();
  const [previousUrls] = useState(backendUrls);
  /*
   * Nothing signed in and nothing stored means a first visit, and the
   * dashboard is served BY the backend in the all-in-one deployment - so the
   * domain it was loaded from is the backend. A literal default sent the
   * login screen probing localhost from a public page, which the browser
   * rightly asks the visitor about.
   *
   * With backends already stored the field starts empty instead: the only way
   * to get here is adding another one, and the dropdown offers the rest.
   */
  const [url, setUrl] = useState(() =>
    backend?.url ?? (previousUrls.length === 0 ? window.location.origin : ''));
  const [username, setUsername] = useState(backend?.username ?? 'root');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [providers, setProviders] = useState<OidcProvider[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [canReset, setCanReset] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotUser, setForgotUser] = useState('');
  const [forgotSent, setForgotSent] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Clicking anywhere else closes the backend dropdown.
  useEffect(() => {
    if (!pickerOpen) {
      return;
    }
    const handler = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  /*
   * Coming back from a provider — swap its id_token for a Magic ticket, using
   * the backend we remembered before redirecting away.
   */
  useEffect(() => {
    const idToken = takeIdTokenFromUrl();
    if (!idToken) {
      return;
    }
    // Only consumed once there's a token to exchange, so an ordinary page
    // load can't throw away a redirect that's still in flight.
    const pending = takePendingOidc();
    if (!pending) {
      setError('Could not tell which backend this sign-in was for — try again');
      return;
    }
    setBusy(true);
    openidLogin(pending.backendUrl, idToken)
      .then(response => {
        // Back to whatever the user was trying to reach before signing in.
        navigate(pending.returnPath, { replace: true });
        loginWithTicket(pending.backendUrl, response.ticket);
      })
      .catch(err => setError(err.message ?? 'Could not complete sign-in'))
      .finally(() => setBusy(false));
  }, [loginWithTicket, navigate]);

  /*
   * Debounced — these probe the backend URL as it is being typed, and firing
   * one request per keystroke means probing half-typed hostnames.
   */
  const probeUrl = useDebounced(url, 500);

  // Only offer a link the backend can actually send.
  useEffect(() => {
    let cancelled = false;
    canResetPassword(probeUrl).then(value => { if (!cancelled) { setCanReset(value); } });
    return () => { cancelled = true; };
  }, [probeUrl]);

  /*
   * Which providers the backend has configured — there may be none, in which
   * case nothing extra is shown, or several.
   */
  useEffect(() => {
    let cancelled = false;
    openidProviders(probeUrl)
      .then(list => { if (!cancelled) { setProviders(list); } })
      .catch(() => { if (!cancelled) { setProviders([]); } });
    return () => { cancelled = true; };
  }, [probeUrl]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(url, username, password);
    } catch (err: any) {
      setError(err.message ?? 'Could not authenticate');
    } finally {
      setBusy(false);
    }
  }

  async function sendLink(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const response = await sendResetPasswordLink(url, forgotUser.trim());
      setForgotSent(response.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Hands off to the provider, having remembered which backend to come back to.
  function signInWith(provider: OidcProvider) {
    if (!provider.url || !provider.client_id) {
      setError(provider.name + ' is not fully configured on this backend');
      return;
    }
    /*
     * The provider takes us out of the app, so remember where to come back
     * to — the route is still whatever the user deep-linked to, since the
     * login screen renders in place without navigating.
     */
    rememberPendingOidc({
      backendUrl: url,
      returnPath: window.location.pathname + window.location.search,
    });
    const query = new URLSearchParams({
      client_id: provider.client_id,
      response_type: provider.response_type ?? 'id_token',
      scope: provider.scope ?? 'openid email profile',
      /*
       * Built from the origin rather than the current location — the route
       * the user logged out from is irrelevant, and providers match this
       * string exactly against what's registered.
       */
      redirect_uri: window.location.origin + OIDC_CALLBACK_PATH,
      nonce: provider.nonce ?? '',
    });
    window.location.href = provider.url + '?' + query.toString();
  }

  if (forgotOpen) {
    return (
      <div className="login-wrapper">
        <form className="login-card" onSubmit={sendLink}>
          <h1>magic</h1>
          <p className="muted" style={{ textAlign: 'center', margin: 0 }}>
            {forgotSent
              ? 'Check your inbox'
              : "We'll email you a link that signs you in"}
          </p>
          {error && <Banner onClose={() => setError('')}>{error}</Banner>}
          {forgotSent
            ? <p style={{ textAlign: 'center', margin: 0 }}>{forgotSent}</p>
            : (
              <label>
                Username or email
                <input
                  type="text"
                  autoFocus
                  value={forgotUser}
                  onChange={e => setForgotUser(e.target.value)}
                  required />
              </label>
            )}
          {!forgotSent && (
            <button className="btn" type="submit" disabled={busy || !forgotUser.trim()}>
              {busy ? 'Sending…' : 'Send link'}
            </button>
          )}
          <button
            type="button"
            className="link-like"
            onClick={() => { setForgotOpen(false); setError(''); }}>
            Back to sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
      <form className="login-card" onSubmit={submit}>
        <h1>magic</h1>
        <p className="muted" style={{ textAlign: 'center', margin: 0 }}>
          Sign in to your backend
        </p>
        {error && <Banner onClose={() => setError('')}>{error}</Banner>}
        <label>
          Backend URL
          {/*
            * A plain input with its own dropdown rather than a datalist —
            * a datalist filters its options by whatever is already typed,
            * so picking a different backend meant clearing the field first.
            */}
          <div className="combo" ref={pickerRef}>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="http://localhost:5000"
              required />
            {previousUrls.length > 0 && (
              <button
                type="button"
                className={'combo-toggle' + (pickerOpen ? ' open' : '')}
                title="Backends you have signed in to"
                onClick={() => setPickerOpen(!pickerOpen)}>
                <ChevronIcon />
              </button>
            )}
            {pickerOpen && (
              <div className="combo-list">
                {previousUrls.map(candidate => (
                  <button
                    type="button"
                    key={candidate}
                    className={'combo-option' + (candidate === url ? ' active' : '')}
                    onClick={() => { setUrl(candidate); setPickerOpen(false); }}>
                    {candidate}
                  </button>
                ))}
              </div>
            )}
          </div>
        </label>
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required />
        </label>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        {canReset && (
          <button
            type="button"
            className="link-like"
            onClick={() => {
              // Whatever they were signing in as is the obvious starting point.
              setForgotUser(username);
              setForgotSent('');
              setError('');
              setForgotOpen(true);
            }}>
            Get magnetic link
          </button>
        )}
        {providers.length > 0 && (
          <>
            <div className="login-divider"><span>or</span></div>
            {providers.map(provider => (
              <button
                key={provider.issuer}
                type="button"
                className="btn btn-secondary"
                disabled={busy}
                onClick={() => signInWith(provider)}>
                Continue with {provider.name}
              </button>
            ))}
          </>
        )}
      </form>
    </div>
  );
}
