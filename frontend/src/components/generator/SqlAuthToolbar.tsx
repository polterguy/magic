import RoleChips from '../RoleChips';
import { SqlEndpointTabState } from './hooks/useSqlEndpointTab';

/*
 * Authorisation reads the way it does on the CRUD tab: the roles as a
 * summary, and the chips only once you ask to change them. The chips
 * take a full flex basis so they break onto their own line rather than
 * pushing the rest of the toolbar along.
 */
export default function SqlAuthToolbar({ sql }: Readonly<{ sql: SqlEndpointTabState }>) {
  const { roles, auth, setAuth, authOpen, setAuthOpen, overwrite, setOverwrite } = sql;
  return (
    <div className="toolbar">
      <div style={{ fontWeight: 600, fontSize: 13 }}>Authorisation:</div>
      <span>
        {auth.length > 0 ? auth.join(', ') : <em className="muted">public — no roles</em>}
      </span>
      <button className="btn btn-secondary btn-small" onClick={() => setAuthOpen(!authOpen)}>
        {authOpen ? 'Done' : 'Edit'}
      </button>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input type="checkbox" checked={overwrite} onChange={e => setOverwrite(e.target.checked)} />
        Overwrite
      </label>
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
