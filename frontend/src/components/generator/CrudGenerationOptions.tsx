import Select from '../Select';
import CrudOptionRow, { OptionPill } from './CrudOptionRow';
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
    <CrudOptionRow label="Generation" hint="How the files are written and what they do.">
      <div className="crud-opt-inline">
        <OptionPill label="Log create/update/delete" checked={logging} onChange={setLogging} />
        <OptionPill label="Overwrite existing files" checked={overwrite} onChange={setOverwrite} />
        <OptionPill
          label="Publish live updates"
          checked={live}
          onChange={setLive}
          title="Publish a web socket message after every create, update and delete"
        />
      </div>
      {live && (
        <div className="crud-opt-sub crud-opt-panel">
          <div className="crud-opt-inline">
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
            Messages are named <code>{'<module>.<table>.<post|put|delete>'}</code>, carrying the
            request&apos;s arguments as JSON.
          </span>
        </div>
      )}
    </CrudOptionRow>
  );
}
