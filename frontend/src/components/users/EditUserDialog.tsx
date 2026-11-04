import { useState } from 'react';
import { showToast } from '../../lib/toast';
import { showError } from '../../lib/errors';
import { Modal } from '../Dialogs';
import { useDialog } from '../../lib/useDialog';
import RoleChips from '../RoleChips';
import {
  Role,
  User,
  UserExtra,
  addUserExtra,
  addUserToRole,
  deleteUserExtra,
  removeUserFromRole,
  updateUserExtra,
} from '../../lib/api';

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
      setMemberRoles(memberRoles);
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
          await updateUserExtra(props.user.username, field.type, field.value);
        } else {
          await addUserExtra(props.user.username, field.type, field.value);
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
      width={620}
      onClose={props.onClose}
      onSubmit={() => {
        if (!busy) void save();
      }}
    >
      <h2>Edit {props.user.username}</h2>
      <div className="form-grid">
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Roles</div>
          <RoleChips roles={props.roles} selected={memberRoles} onToggle={toggleRole} />
        </div>
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 6,
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 13 }}>Extra fields</span>
            <button className="btn btn-secondary btn-small" onClick={addField}>
              + Add field
            </button>
          </div>
          {fields.length === 0 && (
            <div className="muted">
              No extra fields — add name, email, or anything else you want to store.
            </div>
          )}
          {fields.map(field => (
            <div
              key={field.type}
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}
            >
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
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>
          Cancel
        </button>
        <button className="btn" onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}
