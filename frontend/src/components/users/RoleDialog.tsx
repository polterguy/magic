import { useState } from 'react';

import { createRole, Role, updateRole } from '../../lib/api';
import { showError } from '../../lib/errors';
import { Modal } from '../Dialogs';

export default function RoleDialog(
  props: Readonly<{
    role: Role | null;
    onClose: () => void;
    onSaved: (name: string) => void;
  }>,
) {
  const [name, setName] = useState(props.role?.name ?? '');
  const [description, setDescription] = useState(props.role?.description ?? '');
  const [busy, setBusy] = useState(false);
  const isEdit = props.role !== null;

  async function save() {
    setBusy(true);
    try {
      if (isEdit) {
        await updateRole(name, description);
      } else {
        await createRole(name, description);
      }
      props.onSaved(name);
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
        if (!busy && name) void save();
      }}
    >
      <h2>{isEdit ? 'Edit role ' + props.role.name : 'New role'}</h2>
      <div className="form-grid">
        <label>
          Name{' '}
          <input
            type="text"
            autoFocus={!isEdit}
            // The name is the role's primary key, so it can't be changed.
            readOnly={isEdit}
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </label>
        <label>
          Description{' '}
          <textarea
            rows={4}
            autoFocus={isEdit}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </label>
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>
          Cancel
        </button>
        <button className="btn" onClick={save} disabled={busy || !name}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}
