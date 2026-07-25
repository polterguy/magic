import { useCallback, useEffect, useState } from 'react';
import { useDialog } from '../components/Dialogs';
import {
  Role,
  User,
  addUserToRole,
  countUsers,
  createRole,
  createUser,
  deleteRole,
  deleteUser,
  getUserRoles,
  listRoles,
  listUsers,
  removeUserFromRole,
} from '../lib/api';

const PAGE_SIZE = 15;

export default function Users() {

  const [users, setUsers] = useState<User[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUserRoles, setSelectedUserRoles] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const { confirm, prompt } = useDialog();

  const refresh = useCallback(async () => {
    try {
      const [userList, userCount, roleList] = await Promise.all([
        listUsers(filter, page * PAGE_SIZE, PAGE_SIZE),
        countUsers(filter),
        listRoles(),
      ]);
      setUsers(userList ?? []);
      setCount(userCount.count);
      setRoles(roleList ?? []);
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }, [filter, page]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function selectUser(username: string) {
    setSelectedUser(username);
    try {
      const userRoles = await getUserRoles(username);
      setSelectedUserRoles((userRoles ?? []).map(entry => entry.role));
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }

  async function addUser() {
    const username = await prompt({ title: 'New user', label: 'Username' });
    if (!username) {
      return;
    }
    const password = await prompt({
      title: 'New user',
      message: username,
      label: 'Password',
      password: true,
    });
    if (!password) {
      return;
    }
    try {
      await createUser(username, password);
      setFeedback({ text: 'User ' + username + ' created', isError: false });
      await refresh();
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }

  async function removeUser(username: string) {
    if (!await confirm({
      title: 'Delete user?',
      message: username,
      confirmText: 'Delete',
      danger: true,
    })) {
      return;
    }
    try {
      await deleteUser(username);
      if (selectedUser === username) {
        setSelectedUser(null);
      }
      await refresh();
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }

  async function toggleRole(role: string, isMember: boolean) {
    if (!selectedUser) {
      return;
    }
    try {
      if (isMember) {
        await removeUserFromRole(selectedUser, role);
      } else {
        await addUserToRole(selectedUser, role);
      }
      await selectUser(selectedUser);
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }

  async function addRole() {
    const name = await prompt({ title: 'New role', label: 'Role name' });
    if (!name) {
      return;
    }
    const description = await prompt({
      title: 'New role',
      message: name,
      label: 'Description',
    }) ?? '';
    try {
      await createRole(name, description);
      await refresh();
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }

  async function removeRole(name: string) {
    if (!await confirm({
      title: 'Delete role?',
      message: name,
      confirmText: 'Delete',
      danger: true,
    })) {
      return;
    }
    try {
      await deleteRole(name);
      await refresh();
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }

  const pageCount = Math.ceil(count / PAGE_SIZE);

  return (
    <>
      <div className="page-header">
        <h1>Users &amp; roles</h1>
        <p>{count} users on your backend</p>
      </div>
      {feedback && (
        <div
          className={feedback.isError ? 'error-box' : 'success-box'}
          style={{ marginBottom: 12 }}>
          {feedback.text}
        </div>
      )}
      <div className="toolbar">
        <input
          type="text"
          placeholder="Filter users…"
          value={filter}
          onChange={e => { setFilter(e.target.value); setPage(0); }}
          style={{ width: 260 }} />
        <span className="spacer" />
        <button className="btn btn-secondary" onClick={addRole}>+ New role</button>
        <button className="btn" onClick={addUser}>+ New user</button>
      </div>
      <div className="editor-split" style={{ flex: 'unset', alignItems: 'flex-start' }}>
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <table>
            <thead>
              <tr><th>Username</th><th style={{ width: 120 }}></th></tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr
                  key={user.username}
                  className="clickable"
                  onClick={() => selectUser(user.username)}
                  style={selectedUser === user.username
                    ? { outline: '2px solid var(--accent)' }
                    : undefined}>
                  <td>{user.username}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={e => { e.stopPropagation(); removeUser(user.username); }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pageCount > 1 && (
            <div className="pagination" style={{ padding: 12 }}>
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
            </div>
          )}
        </div>
        <div className="card">
          {selectedUser ? (
            <>
              <h2 style={{ marginTop: 0 }}>{selectedUser}</h2>
              <div className="editor-pane-title">Roles</div>
              {roles.map(role => {
                const isMember = selectedUserRoles.includes(role.name);
                return (
                  <label
                    key={role.name}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                    <input
                      type="checkbox"
                      checked={isMember}
                      onChange={() => toggleRole(role.name, isMember)} />
                    <span style={{ flex: 1 }}>
                      {role.name}
                      {role.description &&
                        <span className="muted"> — {role.description}</span>}
                    </span>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={e => { e.preventDefault(); removeRole(role.name); }}>
                      ✕
                    </button>
                  </label>
                );
              })}
            </>
          ) : (
            <div className="muted">Select a user to manage its roles.</div>
          )}
        </div>
      </div>
    </>
  );
}
