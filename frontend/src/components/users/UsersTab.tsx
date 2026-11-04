import { useState } from 'react';
import { showToast } from '../../lib/toast';
import AiWaiter from '../AiWaiter';
import SearchInput from '../SearchInput';
import SortHeader from '../SortHeader';
import Pagination from '../Pagination';
import { TableSkeleton } from '../Skeleton';
import { Role, User, userExtra } from '../../lib/api';
import { PROTECTED_USERS } from './constants';
import { useUserList } from './hooks/useUserList';
import NewUserDialog from './NewUserDialog';
import InviteUserDialog from './InviteUserDialog';
import EditUserDialog from './EditUserDialog';
import ChangePasswordDialog from './ChangePasswordDialog';

export default function UsersTab(props: Readonly<{ roles: Role[] }>) {
  const { filter, setFilter, sort, setSort, waiting, smtpReady, list, removeUser, exportUsers } =
    useUserList();
  const [editing, setEditing] = useState<User | null>(null);
  const [changingPassword, setChangingPassword] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);

  return (
    <>
      <div className="toolbar">
        <SearchInput placeholder="Filter by username…" value={filter} onChange={setFilter} />
        <span className="muted">{list.count} users</span>
        <span className="spacer" />
        <button
          className="btn btn-secondary"
          disabled={list.count === 0}
          title="Download every user matching the current filter as CSV"
          onClick={exportUsers}
        >
          Export CSV
        </button>
        <button
          className="btn btn-secondary"
          disabled={smtpReady !== true}
          title={
            smtpReady === false
              ? 'Sending invites needs an SMTP server — configure one under Configuration first'
              : 'Create a user and email them a sign-in link'
          }
          onClick={() => setInviting(true)}
        >
          ✉ Invite user
        </button>
        <button className="btn" onClick={() => setCreating(true)}>
          + New user
        </button>
        <Pagination page={list.page} pageCount={list.pageCount} onPage={list.setPage} />
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        {list.rows === null ? (
          <TableSkeleton columns={6} />
        ) : (
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
                  style={{ width: 120 }}
                />
                <th style={{ width: 220 }}></th>
              </tr>
            </thead>
            <tbody>
              {list.rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 24 }}>
                    {filter ? 'No users match your filter' : 'No users'}
                  </td>
                </tr>
              )}
              {list.rows.map(user => (
                <tr key={user.username}>
                  <td>
                    <strong>{user.username}</strong>
                  </td>
                  <td data-label="Name">
                    {userExtra(user, 'name') || <span className="muted">—</span>}
                  </td>
                  <td data-label="Email">
                    {userExtra(user, 'email') || <span className="muted">—</span>}
                  </td>
                  <td data-label="Roles">
                    {(user.roles ?? []).length > 0 ? (
                      (user.roles ?? []).map(role => (
                        <span className="chip" key={role}>
                          {role}
                        </span>
                      ))
                    ) : (
                      <span className="muted">no roles</span>
                    )}
                  </td>
                  <td className="muted" data-label="Created">
                    {user.created ? user.created.substring(0, 10) : ''}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => setEditing(user)}
                    >
                      Edit
                    </button>{' '}
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => setChangingPassword(user)}
                    >
                      Password
                    </button>{' '}
                    <button
                      className="btn btn-danger btn-small"
                      disabled={PROTECTED_USERS.has(user.username)}
                      title={
                        PROTECTED_USERS.has(user.username)
                          ? 'The ' + user.username + ' user cannot be deleted'
                          : 'Delete user'
                      }
                      onClick={() => removeUser(user.username)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {creating && (
        <NewUserDialog
          roles={props.roles}
          onClose={() => setCreating(false)}
          onCreated={username => {
            setCreating(false);
            showToast('User ' + username + ' created');
            list.refresh();
          }}
        />
      )}
      {inviting && (
        <InviteUserDialog
          roles={props.roles}
          onClose={() => setInviting(false)}
          onInvited={email => {
            setInviting(false);
            showToast('Invite sent — ' + email + ' has 20 minutes to use the link');
            list.refresh();
          }}
        />
      )}
      {editing && (
        <EditUserDialog
          user={editing}
          roles={props.roles}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            showToast('User updated');
            list.refresh();
          }}
        />
      )}
      {changingPassword && (
        <ChangePasswordDialog
          user={changingPassword}
          onClose={() => setChangingPassword(null)}
          onSaved={() => {
            setChangingPassword(null);
            showToast('Password changed');
          }}
        />
      )}
      {waiting && <AiWaiter />}
    </>
  );
}
