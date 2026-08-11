/*
 * Landing screen for the sign in links sent by email.
 *
 * The link carries a token the backend already issued, carrying the user's
 * real roles, so it IS the session — there is nothing to exchange. It gets
 * attached to the backend named in the link, and verified against that
 * backend before anything is shown. A token the backend rejects is discarded
 * rather than left lying in localStorage.
 *
 * Rendered ahead of every gate in App, because a link has to work whether or
 * not somebody is already signed in, and to a different cloudlet than the one
 * they happen to be looking at.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { verifyTicket } from '../lib/api';

export const MAGIC_LINK_PATH = '/authentication/magic-link';

export default function MagicLink() {

  const { backend, loginWithTicket, logout } = useAuth();
  const navigate = useNavigate();
  /*
   * Read from the address bar and deliberately left there. Stripping it made
   * this unusable: StrictMode mounts effects twice, so the second pass found
   * a URL its own first pass had already emptied and reset the token to null,
   * stranding the screen on "Signing you in…". Reading is idempotent.
   *
   * The token stops travelling with the page a moment later anyway, when
   * this navigates away.
   */
  const [token] = useState(
    () => new URLSearchParams(window.location.search).get('token'));

  // Attaching the token to the backend the link named.
  useEffect(() => {
    if (!token || !backend?.url || backend.token === token) {
      return;
    }
    loginWithTicket(backend.url, token);
  }, [token, backend?.url, backend?.token, loginWithTicket]);

  // Then asking that backend whether the token is any good.
  useEffect(() => {
    if (!token || backend?.token !== token) {
      return;
    }
    verifyTicket()
      .then(valid => {
        if (valid) {
          /*
           * Whoever follows an emailed link has no password they know —
           * either a fresh invite or a reset. The dashboard sees this flag
           * and opens the set-password dialog. OIDC and password sign-ins
           * never pass through this screen, so they never see it.
           */
          sessionStorage.setItem('magic2.magic-link-arrival', '1');
          navigate('/', { replace: true });
        } else {
          // Not a token worth keeping.
          logout();
          navigate('/', { replace: true });
        }
      })
      .catch(() => {
        logout();
        navigate('/', { replace: true });
      });
  }, [token, backend?.token, logout, navigate]);

  return (
    <div className="login-wrapper">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <h1>magic</h1>
        <p className="muted" style={{ margin: 0 }}>Signing you in…</p>
      </div>
    </div>
  );
}
