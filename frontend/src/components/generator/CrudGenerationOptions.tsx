import Select from '../Select';
import { CrudTabState } from './hooks/useCrudTab';

// How generation behaves: logging, overwriting, and the live updates published after every change.
export default function CrudGenerationOptions({ crud }: Readonly<{ crud: CrudTabState }>) {
  const {
    auth,
    logging,
    setLogging,
    overwrite,
    setOverwrite,
    live,
    setLive,
    liveAudience,
    setLiveAudience,
    liveValues,
    setLiveValues,
  } = crud;
  return (
    <div>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Generation</div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={logging} onChange={e => setLogging(e.target.checked)} />{' '}
          Log create/update/delete
        </label>
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={overwrite}
            onChange={e => setOverwrite(e.target.checked)}
          />{' '}
          Overwrite existing files
        </label>
        <label
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          title="Publish a web socket message after every create, update and delete"
        >
          <input type="checkbox" checked={live} onChange={e => setLive(e.target.checked)} /> Publish
          live updates
        </label>
      </div>
      {live && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>Notify</span>
            <Select value={liveAudience} onChange={value => setLiveAudience(value)}>
              <option value="inherited">The endpoint&apos;s own roles</option>
              <option value="roles">Roles</option>
              <option value="groups">Groups</option>
              <option value="users">Users</option>
            </Select>
            {liveAudience !== 'inherited' && (
              <input
                type="text"
                placeholder="comma separated"
                value={liveValues}
                onChange={e => setLiveValues(e.target.value)}
              />
            )}
          </div>
          {liveAudience === 'inherited' && auth.length === 0 && (
            <em className="muted">
              The endpoints are public, so every connected client receives these messages.
            </em>
          )}
          <span className="muted">
            Messages are named {'<module>.<table>.<post|put|delete>'}, carrying the request&apos;s
            arguments as JSON.
          </span>
        </div>
      )}
    </div>
  );
}
