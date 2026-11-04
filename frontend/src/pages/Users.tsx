import { useCallback, useEffect, useState } from 'react';

import Tabs from '../components/Tabs';
import RolesTab from '../components/users/RolesTab';
import UsersTab from '../components/users/UsersTab';
import { listRoles, Role } from '../lib/api';
import { showError } from '../lib/errors';

export default function Users() {
  const [tab, setTab] = useState('users');
  const [roles, setRoles] = useState<Role[]>([]);

  const loadRoles = useCallback(async () => {
    try {
      setRoles((await listRoles()) ?? []);
    } catch (err) {
      showError(err);
    }
  }, []);

  useEffect(() => {
    listRoles()
      .then(list => setRoles(list ?? []))
      .catch((err: unknown) => showError(err));
  }, []);

  return (
    <>
      <div className="page-header">
        <h1>Users &amp; roles</h1>
        <p>Manage who can access your backend, and what they&apos;re allowed to do</p>
      </div>
      <Tabs
        tabs={[
          { id: 'users', label: 'Users' },
          { id: 'roles', label: 'Roles' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'users' ? (
        <UsersTab roles={roles} />
      ) : (
        <RolesTab roles={roles} onChanged={loadRoles} />
      )}
    </>
  );
}
