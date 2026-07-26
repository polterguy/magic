/*
 * Every cloudlet signed into, and the means to move between them. Each keeps
 * its own token, so switching doesn't mean signing in again — and signing
 * out of one leaves the others alone.
 *
 * The list can be long: upgrading from the previous dashboard imports every
 * backend it ever stored. So it filters, puts the ones you can actually use
 * first, and offers to clear out the rest.
 */

import SearchInput from './SearchInput';
import { Modal, useDialog } from './Dialogs';
import { useMemo, useState } from 'react';
import { copyToClipboard } from '../lib/toast';
import { useAuth } from '../lib/AuthContext';
import { tokenExpired } from '../lib/backend';

// Signed in means holding a token that hasn't run out.
function connected(token: string | null) {
  return !!token && !tokenExpired(token);
}

export default function BackendsDialog({ onClose }: { onClose: () => void }) {

  const { backend, backends, switchBackend, removeBackend, addBackend } = useAuth();
  const { confirm } = useDialog();
  const [filter, setFilter] = useState('');

  const visible = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return backends
      .filter(candidate =>
        !query ||
        candidate.url.toLowerCase().includes(query) ||
        candidate.username.toLowerCase().includes(query))
      /*
       * Signed in first, then alphabetically — a live cloudlet should never
       * be buried under dozens of expired ones.
       */
      .sort((left, right) =>
        Number(connected(right.token)) - Number(connected(left.token)) ||
        left.url.localeCompare(right.url));
  }, [backends, filter]);

  const signedOut = backends.filter(candidate => !connected(candidate.token));

  return (
    <Modal width={720} onClose={onClose}>
      <h2 style={{ marginTop: 0 }}>Backends</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Switch between the cloudlets you are signed in to.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <SearchInput
          placeholder="Filter backends…"
          value={filter}
          onChange={setFilter}
          style={{ flex: 1 }} />
        <span className="muted" style={{ whiteSpace: 'nowrap' }}>
          {visible.length} of {backends.length}
        </span>
      </div>
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
          {visible.map(candidate => {
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
          {visible.length === 0 && (
            <tr>
              <td colSpan={4} className="muted">Nothing matches that filter.</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="modal-actions">
        {signedOut.length > 0 && (
          <button
            className="btn btn-secondary"
            title="Remove every backend you are no longer signed in to"
            onClick={async () => {
              if (await confirm({
                title: 'Forget ' + signedOut.length + ' signed out backends?',
                message: 'They are removed from this list only — nothing on any server '
                  + 'is changed, and signing in again adds them back.',
                confirmText: 'Forget them',
                danger: true,
              })) {
                signedOut.forEach(candidate => removeBackend(candidate.url));
              }
            }}>
            Forget signed out ({signedOut.length})
          </button>
        )}
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
