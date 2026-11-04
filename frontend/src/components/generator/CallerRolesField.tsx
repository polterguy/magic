import RoleChips from '../RoleChips';

// Who may call a generated endpoint at all, shown as a summary with the role chips on request.
export default function CallerRolesField(
  props: Readonly<{
    roles: string[];
    auth: string[];
    setAuth: (auth: string[]) => void;
    authOpen: boolean;
    setAuthOpen: (open: boolean) => void;
  }>,
) {
  const { roles, auth, setAuth, authOpen, setAuthOpen } = props;
  return (
    <div className="toolbar">
      <div style={{ fontWeight: 600, fontSize: 13 }}>Who may call:</div>
      <span>{auth.length > 0 ? auth.join(', ') : <em className="muted">public — anyone</em>}</span>
      <button className="btn btn-secondary btn-small" onClick={() => setAuthOpen(!authOpen)}>
        {authOpen ? 'Done' : 'Edit'}
      </button>
      {authOpen && (
        <div style={{ flexBasis: '100%' }}>
          <RoleChips
            roles={roles}
            selected={auth}
            onToggle={(role, selected) =>
              setAuth(selected ? [...auth, role] : auth.filter(candidate => candidate !== role))
            }
          />
        </div>
      )}
    </div>
  );
}
