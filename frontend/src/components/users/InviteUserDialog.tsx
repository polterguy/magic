import { useState } from 'react';

import {
  addUserExtra,
  addUserToRole,
  createUser,
  Role,
  sendResetPasswordLink,
} from '../../lib/api';
import { showError } from '../../lib/errors';
import { useAuth } from '../../lib/useAuth';
import BusyLabel from '../BusyLabel';
import { Modal } from '../Dialogs';
import RolesField from './RolesField';

/*
 * Invites someone by email: creates the account with a random password
 * nobody knows, and mails a magic sign-in link — they pick their own
 * password once they arrive. The email doubles as the username.
 */
export default function InviteUserDialog(
  props: Readonly<{
    roles: Role[];
    onClose: () => void;
    onInvited: (email: string) => void;
  }>,
) {
  const { backend } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function invite() {
    setBusy(true);
    try {
      // A throwaway password satisfying the policy — the invitee never
      // learns it, and changes it after following the link.
      const random = new Uint8Array(24);
      crypto.getRandomValues(random);
      const password = btoa(String.fromCodePoint(...random));
      await createUser(email, password);
      await addUserExtra(email, 'email', email);
      if (name) {
        await addUserExtra(email, 'name', name);
      }
      for (const role of selectedRoles) {
        await addUserToRole(email, role); // NOSONAR -- roles are added in order and the first failure stops the invite
      }
      await sendResetPasswordLink(backend?.url ?? '', email);
      props.onInvited(email);
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      width={520}
      onClose={props.onClose}
      onSubmit={() => {
        if (!busy && email) void invite();
      }}
    >
      <h2>Invite user</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Creates the account and emails a sign-in link. The link works once and expires after 20
        minutes — the invitee sets their own password after arriving.
      </p>
      <div className="form-grid">
        <label>
          Email — also becomes the username{' '}
          <input
            type="text"
            data-initial-focus
            autoComplete="off"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </label>
        <label>
          Full name (optional){' '}
          <input type="text" value={name} onChange={e => setName(e.target.value)} />
        </label>
        <RolesField roles={props.roles} selected={selectedRoles} onChange={setSelectedRoles} />
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>
          Cancel
        </button>
        <button className="btn" onClick={invite} disabled={busy || !email.includes('@')}>
          <BusyLabel busy={busy} label="Send invite" busyLabel="Inviting…" />
        </button>
      </div>
    </Modal>
  );
}
