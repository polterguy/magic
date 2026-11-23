import { Role } from '@core/api';
import { showError } from '@core/errors';
import BusyLabel from '@shared/ui/BusyLabel';
import { Modal } from '@shared/ui/Dialogs';
import { useState } from 'react';

import { createRole, updateRole } from '../lib/api';

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
      size="md"
      onClose={props.onClose}
      onSubmit={() => {
        if (!busy && name) void save();
      }}
      title={isEdit ? 'Edit role ' + props.role.name : 'New role'}
      actions={
        <>
          <button className="btn btn-secondary" onClick={props.onClose}>
            Cancel
          </button>
          <button className="btn" onClick={save} disabled={busy || !name}>
            <BusyLabel busy={busy} label="Save" busyLabel="Saving…" />
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label>
          Name{' '}
          <input
            type="text"
            data-initial-focus={!isEdit || undefined}
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
            data-initial-focus={isEdit || undefined}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </label>
      </div>
    </Modal>
  );
}
