import { useState } from 'react';

import RoleChips from '../RoleChips';
import CrudOptionRow from './CrudOptionRow';

// The roles the generated endpoints are restricted to, which can be edited in place.
export default function AuthorisationField(
  props: Readonly<{
    roles: string[];
    auth: string[];
    onAuth: (auth: string[]) => void;
  }>,
) {
  const [open, setOpen] = useState(false);
  return (
    <CrudOptionRow label="Authorisation" hint="Roles allowed to invoke the endpoints.">
      <div className="crud-opt-inline">
        {props.auth.length > 0 ? (
          props.auth.map(role => (
            <span key={role} className="opt-tag mono">
              {role}
            </span>
          ))
        ) : (
          <span className="opt-tag opt-tag-warn">Public — no roles</span>
        )}
        <button className="btn btn-secondary btn-small" onClick={() => setOpen(!open)}>
          {open ? 'Done' : 'Edit'}
        </button>
      </div>
      {open && (
        <div className="crud-opt-sub">
          <RoleChips
            roles={props.roles}
            selected={props.auth}
            onToggle={(role, selected) =>
              props.onAuth(
                selected
                  ? [...props.auth, role]
                  : props.auth.filter(candidate => candidate !== role),
              )
            }
          />
        </div>
      )}
    </CrudOptionRow>
  );
}
