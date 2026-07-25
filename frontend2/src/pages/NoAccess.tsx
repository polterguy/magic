/*
 * Shown when someone signs in successfully but lacks the roles the dashboard
 * needs — however they signed in. Every dashboard endpoint verifies root, so
 * rendering the app would authenticate them and then fail on every request.
 *
 * This deliberately renders outside the layout and calls nothing: no version,
 * no counts, no socket. The roles come from the token itself.
 */

import { useAuth } from '../lib/AuthContext';
import { tokenRoles } from '../lib/backend';

export default function NoAccess() {

  const { backend, logout } = useAuth();
  const roles = backend?.token ? tokenRoles(backend.token) : [];

  return (
    <div className="login-wrapper">
      <div className="login-card" style={{ width: 520, textAlign: 'center' }}>
        <div className="no-access-mark">!</div>
        <h1 style={{ margin: 0 }}>No dashboard access</h1>
        <p style={{ margin: 0 }}>
          You are signed in as <strong>{backend?.username}</strong>, but this
          account cannot use the dashboard.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          The dashboard requires the <strong>root</strong> or <strong>admin</strong>{' '}
          role. This account has{' '}
          {roles.length > 0
            ? <>only <strong>{roles.join(', ')}</strong></>
            : <strong>no roles at all</strong>}.
          Ask an administrator to grant your account access, then sign in again.
        </p>
        <button className="btn" onClick={logout}>Sign out</button>
      </div>
    </div>
  );
}
