import BusyLabel from '../BusyLabel';
import AuthorisationField from './AuthorisationField';
import CrudGenerationOptions from './CrudGenerationOptions';
import CrudGetOptions from './CrudGetOptions';
import { ALL_VERBS, crudSummary } from './crudify';
import CrudOptionRow, { OptionPill } from './CrudOptionRow';
import { CrudTabState } from './hooks/useCrudTab';
import UrlFields from './UrlFields';

// Everything about the endpoints to generate: URL, verbs, roles, options, and the Generate button.
export default function CrudOptionsCard({ crud }: Readonly<{ crud: CrudTabState }>) {
  const {
    selection,
    moduleName,
    setModuleName,
    singleTable,
    componentUrl,
    setComponentUrl,
    verbs,
    toggleVerb,
    roles,
    auth,
    setAuth,
    cache,
    setCache,
    publicCache,
    setPublicCache,
    selectedTables,
    plannedEndpoints,
    generate,
    busy,
  } = crud;
  const ready = selectedTables.size > 0 && verbs.size > 0;
  return (
    <div className="card crud-opts">
      <div className="crud-opts-body">
        <UrlFields
          database={selection.database}
          moduleName={moduleName}
          onModuleName={setModuleName}
          singleTable={singleTable}
          componentUrl={componentUrl}
          onComponentUrl={setComponentUrl}
        />
        <CrudOptionRow label="HTTP verbs" hint="One endpoint per verb and table.">
          <div className="crud-opt-inline">
            {ALL_VERBS.map(verb => (
              <OptionPill
                key={verb}
                mono
                label={verb.toUpperCase()}
                checked={verbs.has(verb)}
                onChange={() => toggleVerb(verb)}
              />
            ))}
          </div>
        </CrudOptionRow>
        <AuthorisationField roles={roles} auth={auth} onAuth={setAuth} />
        <CrudGetOptions crud={crud} />
        <CrudGenerationOptions crud={crud} />
        <CrudOptionRow label="GET cache" hint="Seconds to cache responses, 0 turns it off.">
          <div className="crud-opt-inline">
            <div className="unit-group">
              <input
                type="number"
                min={0}
                aria-label="GET cache in seconds"
                value={cache}
                onChange={e => setCache(e.target.value)}
              />
              <span className="unit-group-unit">sec</span>
            </div>
            <OptionPill
              label="Public cache"
              checked={publicCache}
              onChange={setPublicCache}
              title="Let proxies and CDNs cache the responses, not only the browser"
            />
          </div>
        </CrudOptionRow>
      </div>
      <div className="crud-opts-footer">
        <span className={ready ? 'crud-opts-summary' : 'crud-opts-summary muted'}>
          {crudSummary(
            selectedTables.size,
            verbs.size,
            plannedEndpoints,
            moduleName || selection.database,
          )}
        </span>
        <button className="btn" onClick={generate} disabled={busy || !ready}>
          <BusyLabel busy={busy} label="⚙ Generate backend" busyLabel="Generating…" />
        </button>
      </div>
    </div>
  );
}
