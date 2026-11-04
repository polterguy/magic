import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Banner from '../components/Banner';
import BackendUrlField from '../components/login/BackendUrlField';
import ForgotPasswordForm from '../components/login/ForgotPasswordForm';
import {
  isConfiguredProvider,
  OIDC_CALLBACK_PATH,
  oidcAuthorizeUrl,
  takeCodeFromUrl,
  takeIdTokenFromUrl,
  takeOidcErrorFromUrl,
} from '../components/login/oidc';
import ProviderButtons from '../components/login/ProviderButtons';
import {
  canResetPassword,
  OidcProvider,
  openidExchange,
  openidLogin,
  openidProviders,
  sendResetPasswordLink,
} from '../lib/api';
import { backendUrls, rememberPendingOidc, takePendingOidc } from '../lib/backend';
import { errorMessage } from '../lib/errors';
import { useAuth } from '../lib/useAuth';
import { useDebounced } from '../lib/usePagedList';

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
  const [url, setUrl] = useState(
    () => backend?.url ?? (previousUrls.length === 0 ? window.location.origin : ''),
  );
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
   * Coming back from a provider — swap what it sent for a Magic ticket, using
   * the backend we remembered before redirecting away. Implicit providers
   * answer with an id_token in the fragment, code providers with ?code&state
   * the backend exchanges server-side.
   */
  useEffect(() => {
    const providerError = takeOidcErrorFromUrl();
    if (providerError) {
      // The redirect is over — consume the pending entry so it can't go stale.
      takePendingOidc();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the provider's answer is read from, and stripped off, the URL exactly once on mount; doing that during render would be impure and replay under StrictMode
      setError('The provider refused the sign-in: ' + providerError);
      return;
    }
    const code = takeCodeFromUrl();
    const idToken = code ? null : takeIdTokenFromUrl();
    if (!code && !idToken) {
      return;
    }
    // Only consumed once there's something to exchange, so an ordinary page
    // load can't throw away a redirect that's still in flight.
    const pending = takePendingOidc();
    if (!pending) {
      setError('Could not tell which backend this sign-in was for — try again');
      return;
    }
    setBusy(true);
    const exchange = code
      ? openidExchange(
          pending.backendUrl,
          code.code,
          code.state,
          window.location.origin + OIDC_CALLBACK_PATH,
        )
      : openidLogin(pending.backendUrl, idToken!);
    void exchange
      .then(response => {
        // Back to whatever the user was trying to reach before signing in.
        void navigate(pending.returnPath, { replace: true });
        loginWithTicket(pending.backendUrl, response.ticket);
      })
      .catch((err: unknown) => setError(errorMessage(err, 'Could not complete sign-in')))
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
    canResetPassword(probeUrl)
      .then(value => {
        if (!cancelled) {
          setCanReset(value);
        }
      })
      .catch(error => console.error('Could not check password reset:', error));
    return () => {
      cancelled = true;
    };
  }, [probeUrl]);

  /*
   * Which providers the backend has configured — there may be none, in which
   * case nothing extra is shown, or several.
   */
  useEffect(() => {
    let cancelled = false;
    openidProviders(probeUrl)
      .then(list => {
        if (!cancelled) {
          setProviders(list);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProviders([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [probeUrl]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(url, username, password);
    } catch (err) {
      setError(errorMessage(err, 'Could not authenticate'));
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
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  // Hands off to the provider, having remembered which backend to come back to.
  function signInWith(provider: OidcProvider) {
    if (!isConfiguredProvider(provider)) {
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
    window.location.assign(
      oidcAuthorizeUrl(
        provider,
        /*
         * Built from the origin rather than the current location — the route
         * the user logged out from is irrelevant, and providers match this
         * string exactly against what's registered.
         */
        window.location.origin + OIDC_CALLBACK_PATH,
      ),
    );
  }

  if (forgotOpen) {
    return (
      <ForgotPasswordForm
        error={error}
        onDismissError={() => setError('')}
        busy={busy}
        forgotUser={forgotUser}
        onForgotUser={setForgotUser}
        forgotSent={forgotSent}
        onSubmit={sendLink}
        onBack={() => {
          setForgotOpen(false);
          setError('');
        }}
      />
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
        <BackendUrlField
          url={url}
          onUrl={setUrl}
          previousUrls={previousUrls}
          pickerOpen={pickerOpen}
          onPickerOpen={setPickerOpen}
          ref={pickerRef}
        />
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        {canReset && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              // Whatever they were signing in as is the obvious starting point.
              setForgotUser(username);
              setForgotSent('');
              setError('');
              setForgotOpen(true);
            }}
          >
            Login using magic link
          </button>
        )}
        {providers.length > 0 && (
          <ProviderButtons providers={providers} busy={busy} onSignIn={signInWith} />
        )}
      </form>
    </div>
  );
}
