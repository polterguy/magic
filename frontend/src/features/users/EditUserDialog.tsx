import {
  addUserExtra,
  addUserToRole,
  deleteUserExtra,
  removeUserFromRole,
  Role,
  updateUserExtra,
  User,
  UserExtra,
} from '@core/api';
import { showError } from '@core/errors';
import { showToast } from '@core/toast';
import { useDialog } from '@shared/hooks/useDialog';
import BusyLabel from '@shared/ui/BusyLabel';
import { Modal } from '@shared/ui/Dialogs';
import RoleChips from '@shared/ui/RoleChips';
import { useState } from 'react';

export default function EditUserDialog(
  props: Readonly<{
    user: User;
    roles: Role[];
    onClose: () => void;
    onSaved: () => void;
  }>,
) {
  const [memberRoles, setMemberRoles] = useState<string[]>(props.user.roles ?? []);
  const [fields, setFields] = useState<UserExtra[]>(props.user.extra ?? []);
  const [saved] = useState<UserExtra[]>(props.user.extra ?? []);
  const [busy, setBusy] = useState(false);
  const { confirm, prompt } = useDialog();

  /*
   * Role membership is applied immediately — it's a relation, not part of
   * the form's Save.
   */
  async function toggleRole(role: string, member: boolean) {
    // Optimistic — the checkbox moves with the click; a failed call reverts it.
    const previousRoles = memberRoles;
    setMemberRoles(
      member ? [...memberRoles, role] : memberRoles.filter(candidate => candidate !== role),
    );
    try {
      if (member) {
        await addUserToRole(props.user.username, role);
      } else {
        await removeUserFromRole(props.user.username, role);
      }
    } catch (err) {
      setMemberRoles(previousRoles);
      showError(err);
    }
  }

  async function addField() {
    const type = await prompt({ title: 'Add field', label: 'Field name' });
    if (!type) {
      return;
    }
    if (fields.some(field => field.type === type)) {
      showToast('The user already has a field named ' + type, true);
      return;
    }
    setFields([...fields, { type, value: '' }]);
  }

  async function removeField(type: string) {
    if (
      !(await confirm({
        title: 'Delete field?',
        message: type + ' will be permanently removed from ' + props.user.username + '.',
        confirmText: 'Delete',
        danger: true,
      }))
    ) {
      return;
    }
    setBusy(true);
    try {
      // Only fields that exist server-side need deleting.
      if (saved.some(field => field.type === type)) {
        await deleteUserExtra(props.user.username, type);
      }
      setFields(fields.filter(field => field.type !== type));
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    try {
      for (const field of fields) {
        if (saved.some(existing => existing.type === field.type)) {
          await updateUserExtra(props.user.username, field.type, field.value); // NOSONAR -- one user's extras are written in order and the first failure stops the save
        } else {
          await addUserExtra(props.user.username, field.type, field.value); // NOSONAR -- one user's extras are written in order and the first failure stops the save
        }
      }
      props.onSaved();
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      size="lg"
      onClose={props.onClose}
      onSubmit={() => {
        if (!busy) void save();
      }}
      title={'Edit ' + props.user.username}
      actions={
        <>
          <button className="btn btn-secondary" onClick={props.onClose}>
            Cancel
          </button>
          <button className="btn" onClick={save} disabled={busy}>
            <BusyLabel busy={busy} label="Save" busyLabel="Saving…" />
          </button>
        </>
      }
    >
      <section className="modal-section">
        <div className="modal-section-title">Roles</div>
        <div className="modal-hint">Role changes apply immediately.</div>
        <RoleChips roles={props.roles} selected={memberRoles} onToggle={toggleRole} />
      </section>
      <section className="modal-section">
        <div className="modal-section-title">Extra fields</div>
        {fields.length === 0 && (
          <div className="modal-hint">
            No extra fields — add name, email, or anything else you want to store.
          </div>
        )}
        {fields.map(field => (
          <div key={field.type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="mono" style={{ width: 140, flexShrink: 0 }}>
              {field.type}
            </span>
            <input
              type="text"
              style={{ flex: 1 }}
              value={field.value}
              onChange={e =>
                setFields(
                  fields.map(candidate =>
                    candidate.type === field.type
                      ? { ...candidate, value: e.target.value }
                      : candidate,
                  ),
                )
              }
            />
            <button
              className="btn btn-danger btn-small"
              title="Delete field"
              onClick={() => removeField(field.type)}
            >
              ✕
            </button>
          </div>
        ))}
        <div>
          <button className="btn btn-secondary btn-small" onClick={addField}>
            + Add field
          </button>
        </div>
      </section>
    </Modal>
  );
}
