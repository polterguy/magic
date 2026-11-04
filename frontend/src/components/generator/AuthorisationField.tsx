import { useState } from 'react';
import RoleChips from '../RoleChips';

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
    <div>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Authorisation</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span>
          {props.auth.length > 0 ? (
            props.auth.join(', ')
          ) : (
            <em className="muted">public — no roles</em>
          )}
        </span>
        <button className="btn btn-secondary btn-small" onClick={() => setOpen(!open)}>
          {open ? 'Done' : 'Edit'}
        </button>
      </div>
      {open && (
        <div style={{ marginTop: 8 }}>
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
    </div>
  );
}
