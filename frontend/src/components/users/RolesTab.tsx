import { useState } from 'react';
import { showToast } from '../../lib/toast';
import { showError } from '../../lib/errors';
import AiWaiter from '../AiWaiter';
import SearchInput from '../SearchInput';
import { useDialog } from '../../lib/useDialog';
import { Role, deleteRole } from '../../lib/api';
import { PROTECTED_ROLES } from './constants';
import { filterRoles } from './helpers';
import RoleDialog from './RoleDialog';

export default function RolesTab(props: Readonly<{ roles: Role[]; onChanged: () => void }>) {
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<Role | null>(null);
  const [creating, setCreating] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const { confirmTyped } = useDialog();

  const visible = filterRoles(props.roles, filter);

  async function removeRole(role: Role) {
    if (
      !(await confirmTyped({
        title: 'Delete role?',
        message:
          'This permanently deletes ' +
          role.name +
          ' and removes it from every user. Type the role name to confirm.',
        label: 'Role name',
        expected: role.name,
      }))
    ) {
      return;
    }
    setWaiting(true);
    try {
      await deleteRole(role.name);
      showToast('Role ' + role.name + ' deleted');
      props.onChanged();
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  return (
    <>
      <div className="toolbar">
        <SearchInput placeholder="Filter roles…" value={filter} onChange={setFilter} />
        <span className="muted">
          {visible.length} of {props.roles.length} roles
        </span>
        <span className="spacer" />
        <button className="btn" onClick={() => setCreating(true)}>
          + New role
        </button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 200 }}>Name</th>
              <th>Description</th>
              <th style={{ width: 160 }}></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={3} className="muted" style={{ textAlign: 'center', padding: 24 }}>
                  No roles match your filter
                </td>
              </tr>
            )}
            {visible.map(role => (
              <tr key={role.name}>
                <td>
                  <strong>{role.name}</strong>
                </td>
                <td data-label="Description">
                  {role.description || <span className="muted">no description</span>}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="btn btn-secondary btn-small" onClick={() => setEditing(role)}>
                    Edit
                  </button>{' '}
                  <button
                    className="btn btn-danger btn-small"
                    disabled={PROTECTED_ROLES.has(role.name)}
                    title={
                      PROTECTED_ROLES.has(role.name)
                        ? 'The ' + role.name + ' role cannot be deleted'
                        : 'Delete role'
                    }
                    onClick={() => removeRole(role)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(creating || editing) && (
        <RoleDialog
          role={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={name => {
            setCreating(false);
            setEditing(null);
            showToast('Role ' + name + ' saved');
            props.onChanged();
          }}
        />
      )}
      {waiting && <AiWaiter />}
    </>
  );
}
