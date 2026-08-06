import { showToast } from '../lib/toast';
import AiWaiter from '../components/AiWaiter';
import SearchInput from '../components/SearchInput';
import { useCallback, useEffect, useState } from 'react';
import { Modal, useDialog } from '../components/Dialogs';
import SortHeader, { useSort } from '../components/SortHeader';
import Tabs from '../components/Tabs';
import {
  Role,
  User,
  UserExtra,
  addUserExtra,
  addUserToRole,
  changeUserPassword,
  countUsers,
  createRole,
  createUser,
  deleteRole,
  deleteUser,
  deleteUserExtra,
  listRoles,
  listUsers,
  removeUserFromRole,
  updateRole,
  updateUserExtra,
  userExtra,
} from '../lib/api';

const PAGE_SIZE = 15;

// Roles the backend depends on, and which therefore can't be deleted.
const PROTECTED_ROLES = ['root'];

/*
 * Notifications go to the toast stack. An inline banner is part of the page,
 * so showing one pushed everything below it down — the editors and grids
 * jumped under the pointer. Toasts float above the page instead.
 */
function setFeedback(value: { text: string; isError: boolean } | null) {
  if (value) {
    showToast(value.text, value.isError);
  }
}

export default function Users() {

  const [tab, setTab] = useState('users');
  const [roles, setRoles] = useState<Role[]>([]);

  const loadRoles = useCallback(async () => {
    try {
      setRoles(await listRoles() ?? []);
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  return (
    <>
      <div className="page-header">
        <h1>Users &amp; roles</h1>
        <p>Manage who can access your backend, and what they're allowed to do</p>
      </div>
      <Tabs
        tabs={[
          { id: 'users', label: 'Users' },
          { id: 'roles', label: 'Roles' },
        ]}
        active={tab}
        onChange={setTab} />
      {tab === 'users'
        ? <UsersTab roles={roles} notify={setFeedback} />
        : <RolesTab roles={roles} onChanged={loadRoles} notify={setFeedback} />}
    </>
  );
}

type Notify = (feedback: { text: string; isError: boolean } | null) => void;

function UsersTab(props: { roles: Role[]; notify: Notify }) {

  const [users, setUsers] = useState<User[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useSort();
  const [editing, setEditing] = useState<User | null>(null);
  const [changingPassword, setChangingPassword] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const { prompt } = useDialog();

  const refresh = useCallback(async () => {
    try {
      const [userList, userCount] = await Promise.all([
        listUsers(filter, page * PAGE_SIZE, PAGE_SIZE, sort),
        countUsers(filter),
      ]);
      setUsers(userList ?? []);
      setCount(userCount.count);
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    }
  }, [filter, page, sort]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /*
   * Deleting a user is permanent, so it follows the old dashboard's rule of
   * having the user type the username to confirm.
   */
  async function removeUser(username: string) {
    const typed = await prompt({
      title: 'Delete user?',
      message: 'This permanently deletes ' + username +
        '. Type the username to confirm.',
      label: 'Username',
      confirmText: 'Delete',
    });
    if (typed === null) {
      return;
    }
    if (typed !== username) {
      props.notify({ text: 'Name did not match — nothing deleted', isError: true });
      return;
    }
    setWaiting(true);
    try {
      await deleteUser(username);
      props.notify({ text: username + ' deleted', isError: false });
      await refresh();
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    } finally {
      setWaiting(false);
    }
  }

  const pageCount = Math.ceil(count / PAGE_SIZE);

  return (
    <>
      <div className="toolbar">
        <SearchInput
          placeholder="Filter users…"
          value={filter}
          onChange={value => { setFilter(value); setPage(0); }} />
        <span className="muted">{count} users</span>
        <span className="spacer" />
        <button className="btn" onClick={() => setCreating(true)}>+ New user</button>
        {pageCount > 1 && (
          <>
            <button
              className="btn btn-secondary btn-small"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}>
              ‹ Prev
            </button>
            <span className="muted">{page + 1} / {pageCount}</span>
            <button
              className="btn btn-secondary btn-small"
              disabled={page >= pageCount - 1}
              onClick={() => setPage(page + 1)}>
              Next ›
            </button>
          </>
        )}
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <SortHeader column="username" label="Username" sort={sort} onSort={setSort} />
              <th>Name</th>
              <th>Email</th>
              <th>Roles</th>
              <SortHeader
                column="created"
                label="Created"
                sort={sort}
                onSort={setSort}
                style={{ width: 120 }} />
              <th style={{ width: 220 }}></th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.username}>
                <td><strong>{user.username}</strong></td>
                <td data-label="Name">{userExtra(user, 'name') || <span className="muted">—</span>}</td>
                <td data-label="Email">{userExtra(user, 'email') || <span className="muted">—</span>}</td>
                <td data-label="Roles">
                  {(user.roles ?? []).length > 0
                    ? (user.roles ?? []).map(role =>
                        <span className="chip" key={role}>{role}</span>)
                    : <span className="muted">no roles</span>}
                </td>
                <td className="muted" data-label="Created">
                  {user.created ? user.created.substring(0, 10) : ''}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => setEditing(user)}>
                    Edit
                  </button>
                  {' '}
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => setChangingPassword(user)}>
                    Password
                  </button>
                  {' '}
                  <button
                    className="btn btn-danger btn-small"
                    disabled={user.username === 'root'}
                    title={user.username === 'root' ? 'The root user cannot be deleted' : 'Delete user'}
                    onClick={() => removeUser(user.username)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {creating && (
        <NewUserDialog
          roles={props.roles}
          onClose={() => setCreating(false)}
          onCreated={async username => {
            setCreating(false);
            props.notify({ text: 'User ' + username + ' created', isError: false });
            await refresh();
          }}
          onError={message => props.notify({ text: message, isError: true })} />
      )}
      {editing && (
        <EditUserDialog
          user={editing}
          roles={props.roles}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            props.notify({ text: 'User updated', isError: false });
            await refresh();
          }}
          onError={message => props.notify({ text: message, isError: true })} />
      )}
      {changingPassword && (
        <ChangePasswordDialog
          user={changingPassword}
          onClose={() => setChangingPassword(null)}
          onSaved={() => {
            setChangingPassword(null);
            props.notify({ text: 'Password changed', isError: false });
          }}
          onError={message => props.notify({ text: message, isError: true })} />
      )}
      {waiting && <AiWaiter />}
    </>
  );
}

function RoleChecklist(props: {
  roles: Role[];
  selected: string[];
  onToggle: (role: string, isMember: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {props.roles.map(role => {
        const isMember = props.selected.includes(role.name);
        return (
          <label
            key={role.name}
            className="chip"
            title={role.description}
            style={{
              display: 'inline-flex',
              flexDirection: 'row',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
            }}>
            <input
              type="checkbox"
              checked={isMember}
              onChange={() => props.onToggle(role.name, isMember)} />
            {role.name}
          </label>
        );
      })}
    </div>
  );
}

function NewUserDialog(props: {
  roles: Role[];
  onClose: () => void;
  onCreated: (username: string) => void;
  onError: (message: string) => void;
}) {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await createUser(username, password);
      // Optional details are stored as extra fields on the new user.
      if (name) {
        await addUserExtra(username, 'name', name);
      }
      if (email) {
        await addUserExtra(username, 'email', email);
      }
      for (const role of selectedRoles) {
        await addUserToRole(username, role);
      }
      props.onCreated(username);
    } catch (err: any) {
      props.onError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      width={520}
      onClose={props.onClose}
      onSubmit={() => { if (!busy && username && password) save(); }}>
      <h2>New user</h2>
      <div className="form-grid">
        <label>Username
          <input
            type="text"
            autoFocus
            autoComplete="off"
            value={username}
            onChange={e => setUsername(e.target.value)} />
        </label>
        <label>Password
          <input
            type="text"
            // Someone else's password, so it is masked with CSS rather than
            // being a password field the browser offers to save as yours.
            className="secret"
            autoComplete="off"
            value={password}
            onChange={e => setPassword(e.target.value)} />
        </label>
        <label>Full name (optional)
          <input type="text" value={name} onChange={e => setName(e.target.value)} />
        </label>
        <label>Email (optional)
          <input type="text" value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Roles (optional)</div>
          <RoleChecklist
            roles={props.roles}
            selected={selectedRoles}
            onToggle={(role, isMember) => setSelectedRoles(isMember
              ? selectedRoles.filter(candidate => candidate !== role)
              : [...selectedRoles, role])} />
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button className="btn" onClick={save} disabled={busy || !username || !password}>
          {busy ? 'Creating…' : 'Create user'}
        </button>
      </div>
    </Modal>
  );
}

function EditUserDialog(props: {
  user: User;
  roles: Role[];
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}) {

  const [memberRoles, setMemberRoles] = useState<string[]>(props.user.roles ?? []);
  const [fields, setFields] = useState<UserExtra[]>(props.user.extra ?? []);
  const [saved] = useState<UserExtra[]>(props.user.extra ?? []);
  const [busy, setBusy] = useState(false);
  const { confirm, prompt } = useDialog();

  /*
   * Role membership is applied immediately — it's a relation, not part of
   * the form's Save.
   */
  async function toggleRole(role: string, isMember: boolean) {
    // Optimistic — the checkbox moves with the click; a failed call reverts it.
    setMemberRoles(isMember
      ? memberRoles.filter(candidate => candidate !== role)
      : [...memberRoles, role]);
    try {
      if (isMember) {
        await removeUserFromRole(props.user.username, role);
      } else {
        await addUserToRole(props.user.username, role);
      }
    } catch (err: any) {
      setMemberRoles(memberRoles);
      props.onError(err.message);
    }
  }

  async function addField() {
    const type = await prompt({ title: 'Add field', label: 'Field name' });
    if (!type) {
      return;
    }
    if (fields.some(field => field.type === type)) {
      props.onError('The user already has a field named ' + type);
      return;
    }
    setFields([...fields, { type, value: '' }]);
  }

  async function removeField(type: string) {
    if (!await confirm({
      title: 'Delete field?',
      message: type + ' will be permanently removed from ' + props.user.username + '.',
      confirmText: 'Delete',
      danger: true,
    })) {
      return;
    }
    setBusy(true);
    try {
      // Only fields that exist server-side need deleting.
      if (saved.some(field => field.type === type)) {
        await deleteUserExtra(props.user.username, type);
      }
      setFields(fields.filter(field => field.type !== type));
    } catch (err: any) {
      props.onError(err.message);
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
    } catch (err: any) {
      props.onError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal width={620} onClose={props.onClose} onSubmit={() => { if (!busy) save(); }}>
      <h2>Edit {props.user.username}</h2>
      <div className="form-grid">
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Roles</div>
          <RoleChecklist roles={props.roles} selected={memberRoles} onToggle={toggleRole} />
        </div>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 6,
          }}>
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
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="mono" style={{ width: 140, flexShrink: 0 }}>{field.type}</span>
              <input
                type="text"
                style={{ flex: 1 }}
                value={field.value}
                onChange={e => setFields(fields.map(candidate =>
                  candidate.type === field.type
                    ? { ...candidate, value: e.target.value }
                    : candidate))} />
              <button
                className="btn btn-danger btn-small"
                title="Delete field"
                onClick={() => removeField(field.type)}>
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Close</button>
        <button className="btn" onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}

function ChangePasswordDialog(props: {
  user: User;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}) {

  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await changeUserPassword(props.user.username, password);
      props.onSaved();
    } catch (err: any) {
      props.onError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      width={480}
      onClose={props.onClose}
      onSubmit={() => { if (!busy && password) save(); }}>
      <h2>Change password for {props.user.username}</h2>
      <label className="modal-label">
        New password
        <input
          type="text"
          autoFocus
          // Someone else's password, so it is masked with CSS rather than
          // being a password field the browser offers to save as yours.
          className="secret"
          autoComplete="off"
          value={password}
          onChange={e => setPassword(e.target.value)} />
      </label>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button className="btn" onClick={save} disabled={busy || !password}>
          {busy ? 'Saving…' : 'Change password'}
        </button>
      </div>
    </Modal>
  );
}

function RolesTab(props: { roles: Role[]; onChanged: () => void; notify: Notify }) {

  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<Role | null>(null);
  const [creating, setCreating] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const { prompt } = useDialog();

  const query = filter.trim().toLowerCase();
  const visible = props.roles.filter(role =>
    !query ||
    role.name.toLowerCase().includes(query) ||
    (role.description ?? '').toLowerCase().includes(query));

  async function removeRole(role: Role) {
    const typed = await prompt({
      title: 'Delete role?',
      message: 'This permanently deletes ' + role.name +
        ' and removes it from every user. Type the role name to confirm.',
      label: 'Role name',
      confirmText: 'Delete',
    });
    if (typed === null) {
      return;
    }
    if (typed !== role.name) {
      props.notify({ text: 'Name did not match — nothing deleted', isError: true });
      return;
    }
    setWaiting(true);
    try {
      await deleteRole(role.name);
      props.notify({ text: 'Role ' + role.name + ' deleted', isError: false });
      props.onChanged();
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    } finally {
      setWaiting(false);
    }
  }

  return (
    <>
      <div className="toolbar">
        <SearchInput
          placeholder="Filter roles…"
          value={filter}
          onChange={setFilter} />
        <span className="muted">{visible.length} of {props.roles.length} roles</span>
        <span className="spacer" />
        <button className="btn" onClick={() => setCreating(true)}>+ New role</button>
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
            {visible.map(role => (
              <tr key={role.name}>
                <td><strong>{role.name}</strong></td>
                <td data-label="Description">
                  {role.description || <span className="muted">no description</span>}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => setEditing(role)}>
                    Edit
                  </button>
                  {' '}
                  <button
                    className="btn btn-danger btn-small"
                    disabled={PROTECTED_ROLES.includes(role.name)}
                    title={PROTECTED_ROLES.includes(role.name)
                      ? 'The ' + role.name + ' role cannot be deleted'
                      : 'Delete role'}
                    onClick={() => removeRole(role)}>
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
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={name => {
            setCreating(false);
            setEditing(null);
            props.notify({ text: 'Role ' + name + ' saved', isError: false });
            props.onChanged();
          }}
          onError={message => props.notify({ text: message, isError: true })} />
      )}
      {waiting && <AiWaiter />}
    </>
  );
}

function RoleDialog(props: {
  role: Role | null;
  onClose: () => void;
  onSaved: (name: string) => void;
  onError: (message: string) => void;
}) {

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
    } catch (err: any) {
      props.onError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal width={520} onClose={props.onClose} onSubmit={() => { if (!busy && name) save(); }}>
      <h2>{isEdit ? 'Edit role ' + props.role!.name : 'New role'}</h2>
      <div className="form-grid">
        <label>Name
          <input
            type="text"
            autoFocus={!isEdit}
            // The name is the role's primary key, so it can't be changed.
            readOnly={isEdit}
            value={name}
            onChange={e => setName(e.target.value)} />
        </label>
        <label>Description
          <textarea
            rows={4}
            autoFocus={isEdit}
            value={description}
            onChange={e => setDescription(e.target.value)} />
        </label>
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button className="btn" onClick={save} disabled={busy || !name}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}
