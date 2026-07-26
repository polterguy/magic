/*
 * Every cloudlet signed into, and the means to move between them. Each keeps
 * its own token, so switching doesn't mean signing in again — and signing
 * out of one leaves the others alone.
 */

import { Modal, useDialog } from './Dialogs';
import { copyToClipboard } from '../lib/toast';
import { useAuth } from '../lib/AuthContext';
import { tokenExpired } from '../lib/backend';

export default function BackendsDialog({ onClose }: { onClose: () => void }) {

  const { backend, backends, switchBackend, removeBackend, addBackend } = useAuth();
  const { confirm } = useDialog();

  // Signed in means holding a token that hasn't run out.
  function connected(token: string | null) {
    return !!token && !tokenExpired(token);
  }

  return (
    <Modal width={720} onClose={onClose}>
      <h2 style={{ marginTop: 0 }}>Backends</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Switch between the cloudlets you are signed in to.
      </p>
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Backend URL</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {backends.map(candidate => {
            const active = candidate.url === backend?.url;
            return (
              <tr key={candidate.url}>
                <td>{candidate.username || <span className="muted">—</span>}</td>
                <td className="mono">{candidate.url}</td>
                <td>
                  <span className={'badge ' + (connected(candidate.token) ? 'badge-get' : 'badge-debug')}>
                    {connected(candidate.token) ? 'connected' : 'signed out'}
                  </span>
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button
                    className="btn btn-secondary btn-small"
                    disabled={active}
                    title={active ? 'This is the backend you are using' : 'Use this backend'}
                    onClick={() => { switchBackend(candidate.url); onClose(); }}>
                    {active ? 'Current' : 'Switch'}
                  </button>
                  {' '}
                  <button
                    className="btn btn-secondary btn-small"
                    title="A link that opens the dashboard against this backend"
                    onClick={() => copyToClipboard(
                      window.location.origin + '?backend=' + encodeURIComponent(candidate.url),
                      'The link')}>
                    Copy link
                  </button>
                  {' '}
                  <button
                    className="btn btn-danger btn-small"
                    onClick={async () => {
                      if (await confirm({
                        title: 'Forget ' + candidate.url + '?',
                        message: 'This removes it from the list and discards its token. ' +
                          'Nothing on the server is changed.',
                        confirmText: 'Forget it',
                        danger: true,
                      })) {
                        removeBackend(candidate.url);
                      }
                    }}>
                    Forget
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
        <button
          className="btn"
          title="Sign in to another cloudlet"
          onClick={() => { addBackend(); onClose(); }}>
          Add backend
        </button>
      </div>
    </Modal>
  );
}
