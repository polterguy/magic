import { listRoles, Role } from '@core/api';
import { showError } from '@core/errors';
import Tabs from '@shared/ui/Tabs';
import { useCallback, useEffect, useState } from 'react';

import RolesTab from './RolesTab';
import UsersTab from './UsersTab';

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
